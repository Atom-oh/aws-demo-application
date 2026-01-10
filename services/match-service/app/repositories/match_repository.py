"""Repository for match database operations."""

from typing import Optional
from uuid import UUID

from sqlalchemy import func, select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.match import Match, MatchFeedback
from app.models.schemas import MatchCreate, MatchUpdate, MatchFeedbackCreate


class MatchRepository:
    """Repository for match-related database operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, data: MatchCreate) -> Match:
        """Create a new match record."""
        match = Match(
            job_id=data.job_id,
            resume_id=data.resume_id,
            user_id=data.user_id,
        )
        self.session.add(match)
        await self.session.flush()
        await self.session.refresh(match)
        return match

    async def get_by_id(self, match_id: UUID) -> Optional[Match]:
        """Get a match by its ID."""
        stmt = (
            select(Match)
            .options(selectinload(Match.feedbacks))
            .where(Match.id == match_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_job_and_resume(
        self, job_id: UUID, resume_id: UUID
    ) -> Optional[Match]:
        """Get a match by job and resume IDs."""
        stmt = (
            select(Match)
            .options(selectinload(Match.feedbacks))
            .where(Match.job_id == job_id, Match.resume_id == resume_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_job_id(
        self,
        job_id: UUID,
        limit: int = 100,
        offset: int = 0,
        min_score: Optional[float] = None,
    ) -> list[Match]:
        """Get all matches for a job, ordered by score."""
        stmt = (
            select(Match)
            .options(selectinload(Match.feedbacks))
            .where(Match.job_id == job_id)
        )
        if min_score is not None:
            stmt = stmt.where(Match.overall_score >= min_score)
        stmt = stmt.order_by(Match.overall_score.desc()).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_user_id(
        self,
        user_id: UUID,
        limit: int = 100,
        offset: int = 0,
        recommended_only: bool = False,
    ) -> list[Match]:
        """Get all matches for a user."""
        stmt = (
            select(Match)
            .options(selectinload(Match.feedbacks))
            .where(Match.user_id == user_id)
        )
        if recommended_only:
            stmt = stmt.where(Match.is_recommended == True)
        stmt = stmt.order_by(Match.overall_score.desc()).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_recommended_for_user(
        self, user_id: UUID, limit: int = 10
    ) -> list[Match]:
        """Get recommended matches for a user."""
        stmt = (
            select(Match)
            .options(selectinload(Match.feedbacks))
            .where(Match.user_id == user_id, Match.is_recommended == True)
            .order_by(Match.overall_score.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_by_job_id(
        self, job_id: UUID, min_score: Optional[float] = None
    ) -> int:
        """Count matches for a job."""
        stmt = select(func.count(Match.id)).where(Match.job_id == job_id)
        if min_score is not None:
            stmt = stmt.where(Match.overall_score >= min_score)
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def count_by_user_id(
        self, user_id: UUID, recommended_only: bool = False
    ) -> int:
        """Count matches for a user."""
        stmt = select(func.count(Match.id)).where(Match.user_id == user_id)
        if recommended_only:
            stmt = stmt.where(Match.is_recommended == True)
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def update(self, match_id: UUID, data: MatchUpdate) -> Optional[Match]:
        """Update a match record."""
        match = await self.get_by_id(match_id)
        if not match:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(match, field, value)

        await self.session.flush()
        await self.session.refresh(match)
        return match

    async def delete(self, match_id: UUID) -> bool:
        """Delete a match record."""
        stmt = delete(Match).where(Match.id == match_id)
        result = await self.session.execute(stmt)
        return result.rowcount > 0

    async def delete_by_job_id(self, job_id: UUID) -> int:
        """Delete all matches for a job."""
        stmt = delete(Match).where(Match.job_id == job_id)
        result = await self.session.execute(stmt)
        return result.rowcount

    async def delete_by_resume_id(self, resume_id: UUID) -> int:
        """Delete all matches for a resume."""
        stmt = delete(Match).where(Match.resume_id == resume_id)
        result = await self.session.execute(stmt)
        return result.rowcount

    # Feedback operations
    async def create_feedback(self, data: MatchFeedbackCreate) -> MatchFeedback:
        """Create feedback for a match."""
        feedback = MatchFeedback(
            match_id=data.match_id,
            feedback_type=data.feedback_type.value,
            feedback_by=data.feedback_by,
        )
        self.session.add(feedback)
        await self.session.flush()
        await self.session.refresh(feedback)
        return feedback

    async def get_feedback_by_match_id(self, match_id: UUID) -> list[MatchFeedback]:
        """Get all feedback for a match."""
        stmt = (
            select(MatchFeedback)
            .where(MatchFeedback.match_id == match_id)
            .order_by(MatchFeedback.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def delete_feedback(self, feedback_id: UUID) -> bool:
        """Delete a feedback record."""
        stmt = delete(MatchFeedback).where(MatchFeedback.id == feedback_id)
        result = await self.session.execute(stmt)
        return result.rowcount > 0
