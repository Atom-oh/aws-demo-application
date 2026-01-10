"""Business logic service for resume operations."""

import math
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resume import Resume
from app.models.schemas import (
    ResumeCreate,
    ResumeListResponse,
    ResumeResponse,
    ResumeUpdate,
)
from app.repositories.resume_repository import ResumeRepository


class ResumeService:
    """Service for resume business logic."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize service with database session."""
        self.repository = ResumeRepository(session)

    async def create_resume(self, resume_data: ResumeCreate) -> ResumeResponse:
        """Create a new resume."""
        resume = await self.repository.create(resume_data)
        return ResumeResponse.model_validate(resume)

    async def get_resume(self, resume_id: UUID) -> ResumeResponse:
        """Get resume by ID."""
        resume = await self.repository.get_by_id(resume_id)
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resume with id {resume_id} not found",
            )
        return ResumeResponse.model_validate(resume)

    async def get_user_resumes(
        self,
        user_id: UUID,
        page: int = 1,
        size: int = 10,
    ) -> ResumeListResponse:
        """Get paginated resumes for a user."""
        resumes, total = await self.repository.get_by_user_id(user_id, page, size)
        pages = math.ceil(total / size) if total > 0 else 1

        return ResumeListResponse(
            items=[ResumeResponse.model_validate(r) for r in resumes],
            total=total,
            page=page,
            size=size,
            pages=pages,
        )

    async def update_resume(
        self,
        resume_id: UUID,
        update_data: ResumeUpdate,
    ) -> ResumeResponse:
        """Update resume by ID."""
        resume = await self.repository.update(resume_id, update_data)
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resume with id {resume_id} not found",
            )
        return ResumeResponse.model_validate(resume)

    async def delete_resume(self, resume_id: UUID) -> None:
        """Delete resume by ID."""
        deleted = await self.repository.delete(resume_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resume with id {resume_id} not found",
            )

    async def set_primary_resume(
        self,
        user_id: UUID,
        resume_id: UUID,
    ) -> ResumeResponse:
        """Set resume as primary for user."""
        resume = await self.repository.set_primary(user_id, resume_id)
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resume with id {resume_id} not found for user {user_id}",
            )
        return ResumeResponse.model_validate(resume)

    async def get_primary_resume(self, user_id: UUID) -> Optional[ResumeResponse]:
        """Get primary resume for user."""
        resume = await self.repository.get_primary_by_user_id(user_id)
        if resume:
            return ResumeResponse.model_validate(resume)
        return None

    async def update_resume_status(
        self,
        resume_id: UUID,
        new_status: str,
    ) -> ResumeResponse:
        """Update resume processing status."""
        valid_statuses = ["processing", "completed", "failed"]
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {valid_statuses}",
            )

        update_data = ResumeUpdate(status=new_status)
        return await self.update_resume(resume_id, update_data)
