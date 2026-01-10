"""Main FastAPI application for match service."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import router
from app.core.config import settings
from app.core.database import close_db, engine
from app.core.redis import redis_client
from app.models.schemas import HealthResponse

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager."""
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment}")

    try:
        await redis_client.connect()
        logger.info("Redis connection established")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")

    yield

    # Shutdown
    logger.info("Shutting down...")
    await redis_client.disconnect()
    await close_db()
    logger.info("Cleanup complete")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-based job matching service for HireHub",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api/v1")


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["health"],
    summary="Health check endpoint",
)
async def health_check() -> HealthResponse:
    """Check service health including database and Redis connectivity."""
    db_status = "healthy"
    redis_status = "healthy"

    # Check database
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"

    # Check Redis
    try:
        if not await redis_client.ping():
            redis_status = "unhealthy"
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        redis_status = "unhealthy"

    overall_status = "healthy" if db_status == "healthy" and redis_status == "healthy" else "degraded"

    return HealthResponse(
        status=overall_status,
        service=settings.app_name,
        version=settings.app_version,
        database=db_status,
        redis=redis_status,
    )


@app.get(
    "/ready",
    tags=["health"],
    summary="Readiness probe",
)
async def readiness() -> JSONResponse:
    """Kubernetes readiness probe endpoint."""
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        if await redis_client.ping():
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"status": "ready"},
            )
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")

    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"status": "not ready"},
    )


@app.get(
    "/live",
    tags=["health"],
    summary="Liveness probe",
)
async def liveness() -> JSONResponse:
    """Kubernetes liveness probe endpoint."""
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"status": "alive"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
