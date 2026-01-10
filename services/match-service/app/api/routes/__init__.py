"""API routes package for match service."""

from fastapi import APIRouter

from app.api.routes.match import router as match_router

router = APIRouter()
router.include_router(match_router, prefix="/matches", tags=["matches"])

__all__ = ["router"]
