"""Resume API routes."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.schemas import (
    ResumeCreate,
    ResumeListResponse,
    ResumeResponse,
    ResumeUpdate,
)
from app.services.resume_service import ResumeService

router = APIRouter()


def get_resume_service(session: AsyncSession = Depends(get_db)) -> ResumeService:
    """Dependency for getting resume service."""
    return ResumeService(session)


@router.post(
    "",
    response_model=ResumeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new resume",
)
async def create_resume(
    resume_data: ResumeCreate,
    service: ResumeService = Depends(get_resume_service),
) -> ResumeResponse:
    """Create a new resume with experiences, skills, and educations."""
    return await service.create_resume(resume_data)


@router.get(
    "/{resume_id}",
    response_model=ResumeResponse,
    summary="Get resume by ID",
)
async def get_resume(
    resume_id: UUID,
    service: ResumeService = Depends(get_resume_service),
) -> ResumeResponse:
    """Get a resume by its ID."""
    return await service.get_resume(resume_id)


@router.get(
    "/user/{user_id}",
    response_model=ResumeListResponse,
    summary="Get user's resumes",
)
async def get_user_resumes(
    user_id: UUID,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    service: ResumeService = Depends(get_resume_service),
) -> ResumeListResponse:
    """Get paginated list of resumes for a user."""
    return await service.get_user_resumes(user_id, page, size)


@router.get(
    "/user/{user_id}/primary",
    response_model=Optional[ResumeResponse],
    summary="Get user's primary resume",
)
async def get_primary_resume(
    user_id: UUID,
    service: ResumeService = Depends(get_resume_service),
) -> Optional[ResumeResponse]:
    """Get the primary resume for a user."""
    return await service.get_primary_resume(user_id)


@router.patch(
    "/{resume_id}",
    response_model=ResumeResponse,
    summary="Update resume",
)
async def update_resume(
    resume_id: UUID,
    update_data: ResumeUpdate,
    service: ResumeService = Depends(get_resume_service),
) -> ResumeResponse:
    """Update a resume by its ID."""
    return await service.update_resume(resume_id, update_data)


@router.delete(
    "/{resume_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete resume",
)
async def delete_resume(
    resume_id: UUID,
    service: ResumeService = Depends(get_resume_service),
) -> None:
    """Delete a resume by its ID."""
    await service.delete_resume(resume_id)


@router.post(
    "/{resume_id}/set-primary",
    response_model=ResumeResponse,
    summary="Set resume as primary",
)
async def set_primary_resume(
    resume_id: UUID,
    user_id: UUID = Query(..., description="User ID"),
    service: ResumeService = Depends(get_resume_service),
) -> ResumeResponse:
    """Set a resume as the primary resume for a user."""
    return await service.set_primary_resume(user_id, resume_id)


@router.patch(
    "/{resume_id}/status",
    response_model=ResumeResponse,
    summary="Update resume status",
)
async def update_resume_status(
    resume_id: UUID,
    new_status: str = Query(..., description="New status (processing, completed, failed)"),
    service: ResumeService = Depends(get_resume_service),
) -> ResumeResponse:
    """Update the processing status of a resume."""
    return await service.update_resume_status(resume_id, new_status)
