"""AI Service FastAPI Application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import pii, embedding, analysis, rag
from app.core.config import settings
from app.core.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="AI Service",
    description="AgentCore, RAG, and sLLM service for HireHub",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pii.router, prefix="/api/v1/pii", tags=["PII"])
app.include_router(embedding.router, prefix="/api/v1/embedding", tags=["Embedding"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])
app.include_router(rag.router, prefix="/api/v1/rag", tags=["RAG"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "ai-service"}


@app.get("/ready")
async def readiness_check():
    """Readiness check endpoint."""
    return {"status": "ready", "service": "ai-service"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
