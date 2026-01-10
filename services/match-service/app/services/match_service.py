"""Business logic for match service."""

import logging
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.redis import RedisClient
from app.models.match import Match
from app.models.schemas import (
    MatchCreate,
    MatchUpdate,
    MatchScoreRequest,
    MatchScoreResponse,
    MatchFeedbackCreate,
    TopMatchesResponse,
    TopMatchItem,
    RecommendedJobsResponse,
    RecommendedJobItem,
)
from app.repositories.match_repository import MatchRepository

logger = logging.getLogger(__name__)


class MatchService:
    """Service for match-related business logic."""

    def __init__(
        self,
        session: AsyncSession,
        redis: RedisClient,
    ) -> None:
        self.repository = MatchRepository(session)
        self.redis = redis
        self.session = session

    async def create_match(self, data: MatchCreate) -> Match:
        """Create a new match record."""
        return await self.repository.create(data)

    async def get_match(self, match_id: UUID) -> Optional[Match]:
        """Get a match by ID."""
        return await self.repository.get_by_id(match_id)

    async def get_match_by_job_and_resume(
        self, job_id: UUID, resume_id: UUID
    ) -> Optional[Match]:
        """Get a match by job and resume IDs."""
        return await self.repository.get_by_job_and_resume(job_id, resume_id)

    async def get_matches_for_job(
        self,
        job_id: UUID,
        page: int = 1,
        page_size: int = 20,
        min_score: Optional[float] = None,
    ) -> tuple[list[Match], int]:
        """Get matches for a job with pagination."""
        offset = (page - 1) * page_size
        matches = await self.repository.get_by_job_id(
            job_id, limit=page_size, offset=offset, min_score=min_score
        )
        total = await self.repository.count_by_job_id(job_id, min_score=min_score)
        return matches, total

    async def get_matches_for_user(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 20,
        recommended_only: bool = False,
    ) -> tuple[list[Match], int]:
        """Get matches for a user with pagination."""
        offset = (page - 1) * page_size
        matches = await self.repository.get_by_user_id(
            user_id,
            limit=page_size,
            offset=offset,
            recommended_only=recommended_only,
        )
        total = await self.repository.count_by_user_id(
            user_id, recommended_only=recommended_only
        )
        return matches, total

    async def update_match(
        self, match_id: UUID, data: MatchUpdate
    ) -> Optional[Match]:
        """Update a match record."""
        match = await self.repository.update(match_id, data)
        if match:
            # Update cache
            await self._update_cache(match)
        return match

    async def delete_match(self, match_id: UUID) -> bool:
        """Delete a match record."""
        match = await self.repository.get_by_id(match_id)
        if match:
            # Remove from cache
            await self._remove_from_cache(match)
        return await self.repository.delete(match_id)

    async def calculate_match_score(
        self, request: MatchScoreRequest
    ) -> MatchScoreResponse:
        """Calculate or retrieve match score for job-resume pair."""
        # Check cache first
        if not request.force_recalculate:
            cached = await self.redis.get_match_detail(
                str(request.job_id), str(request.resume_id)
            )
            if cached:
                return MatchScoreResponse(
                    match_id=UUID(cached["match_id"]),
                    job_id=request.job_id,
                    resume_id=request.resume_id,
                    overall_score=Decimal(str(cached["overall_score"])),
                    skill_score=Decimal(str(cached["skill_score"])),
                    experience_score=Decimal(str(cached["experience_score"])),
                    culture_score=Decimal(str(cached["culture_score"])),
                    score_breakdown=cached["score_breakdown"],
                    ai_reasoning=cached["ai_reasoning"],
                    is_recommended=cached["is_recommended"],
                    is_cached=True,
                )

        # Check if match exists in database
        existing_match = await self.repository.get_by_job_and_resume(
            request.job_id, request.resume_id
        )

        # Call AI service to calculate score
        score_result = await self._call_ai_service(request)

        # Determine if recommended
        is_recommended = float(score_result["overall_score"]) >= settings.match_recommendation_threshold

        if existing_match:
            # Update existing match
            update_data = MatchUpdate(
                overall_score=Decimal(str(score_result["overall_score"])),
                skill_score=Decimal(str(score_result["skill_score"])),
                experience_score=Decimal(str(score_result["experience_score"])),
                culture_score=Decimal(str(score_result["culture_score"])),
                score_breakdown=score_result["score_breakdown"],
                ai_reasoning=score_result["ai_reasoning"],
                is_recommended=is_recommended,
            )
            match = await self.repository.update(existing_match.id, update_data)
        else:
            # Create new match
            create_data = MatchCreate(
                job_id=request.job_id,
                resume_id=request.resume_id,
                user_id=request.user_id,
            )
            match = await self.repository.create(create_data)
            update_data = MatchUpdate(
                overall_score=Decimal(str(score_result["overall_score"])),
                skill_score=Decimal(str(score_result["skill_score"])),
                experience_score=Decimal(str(score_result["experience_score"])),
                culture_score=Decimal(str(score_result["culture_score"])),
                score_breakdown=score_result["score_breakdown"],
                ai_reasoning=score_result["ai_reasoning"],
                is_recommended=is_recommended,
            )
            match = await self.repository.update(match.id, update_data)

        if match is None:
            raise RuntimeError("Failed to create or update match")

        # Update cache
        await self._update_cache(match)

        return MatchScoreResponse(
            match_id=match.id,
            job_id=request.job_id,
            resume_id=request.resume_id,
            overall_score=match.overall_score or Decimal("0"),
            skill_score=match.skill_score or Decimal("0"),
            experience_score=match.experience_score or Decimal("0"),
            culture_score=match.culture_score or Decimal("0"),
            score_breakdown=match.score_breakdown or {},
            ai_reasoning=match.ai_reasoning or "",
            is_recommended=match.is_recommended,
            is_cached=False,
        )

    async def get_top_matches_for_job(
        self, job_id: UUID, limit: int = 10
    ) -> TopMatchesResponse:
        """Get top matches for a job from cache or database."""
        # Try cache first
        cached = await self.redis.get_top_matches_for_job(str(job_id), limit)
        if cached:
            matches = [
                TopMatchItem(resume_id=UUID(resume_id), score=score)
                for resume_id, score in cached
            ]
            return TopMatchesResponse(
                job_id=job_id,
                matches=matches,
                total=len(matches),
            )

        # Fallback to database
        db_matches = await self.repository.get_by_job_id(job_id, limit=limit)

        # Populate cache
        for match in db_matches:
            if match.overall_score:
                await self.redis.add_match_to_job_ranking(
                    str(job_id), str(match.resume_id), float(match.overall_score)
                )

        matches = [
            TopMatchItem(
                resume_id=match.resume_id,
                score=float(match.overall_score) if match.overall_score else 0,
            )
            for match in db_matches
        ]
        return TopMatchesResponse(
            job_id=job_id,
            matches=matches,
            total=len(matches),
        )

    async def get_recommended_jobs_for_user(
        self, user_id: UUID, limit: int = 10
    ) -> RecommendedJobsResponse:
        """Get recommended jobs for a user from cache or database."""
        # Try cache first
        cached = await self.redis.get_recommended_jobs_for_user(str(user_id), limit)
        if cached:
            jobs = [
                RecommendedJobItem(job_id=UUID(job_id), score=score)
                for job_id, score in cached
            ]
            return RecommendedJobsResponse(
                user_id=user_id,
                jobs=jobs,
                total=len(jobs),
            )

        # Fallback to database
        db_matches = await self.repository.get_recommended_for_user(user_id, limit)

        # Populate cache
        for match in db_matches:
            if match.overall_score:
                await self.redis.add_recommendation_for_user(
                    str(user_id), str(match.job_id), float(match.overall_score)
                )

        jobs = [
            RecommendedJobItem(
                job_id=match.job_id,
                score=float(match.overall_score) if match.overall_score else 0,
            )
            for match in db_matches
        ]
        return RecommendedJobsResponse(
            user_id=user_id,
            jobs=jobs,
            total=len(jobs),
        )

    async def add_feedback(self, data: MatchFeedbackCreate) -> bool:
        """Add feedback for a match."""
        match = await self.repository.get_by_id(data.match_id)
        if not match:
            return False
        await self.repository.create_feedback(data)
        return True

    async def _call_ai_service(self, request: MatchScoreRequest) -> dict[str, Any]:
        """Call AI service to calculate match score."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{settings.ai_service_url}/api/v1/match/score",
                    json={
                        "job_id": str(request.job_id),
                        "resume_id": str(request.resume_id),
                    },
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"AI service call failed: {e}")
            # Return default scores on failure
            return {
                "overall_score": 0.0,
                "skill_score": 0.0,
                "experience_score": 0.0,
                "culture_score": 0.0,
                "score_breakdown": {},
                "ai_reasoning": "Score calculation failed - AI service unavailable",
            }

    async def _update_cache(self, match: Match) -> None:
        """Update all caches for a match."""
        if match.overall_score is None:
            return

        score = float(match.overall_score)

        # Update detail cache
        await self.redis.set_match_detail(
            str(match.job_id),
            str(match.resume_id),
            {
                "match_id": str(match.id),
                "overall_score": score,
                "skill_score": float(match.skill_score) if match.skill_score else 0,
                "experience_score": float(match.experience_score) if match.experience_score else 0,
                "culture_score": float(match.culture_score) if match.culture_score else 0,
                "score_breakdown": match.score_breakdown or {},
                "ai_reasoning": match.ai_reasoning or "",
                "is_recommended": match.is_recommended,
            },
        )

        # Update job top matches
        await self.redis.add_match_to_job_ranking(
            str(match.job_id), str(match.resume_id), score
        )

        # Update user recommendations if recommended
        if match.is_recommended:
            await self.redis.add_recommendation_for_user(
                str(match.user_id), str(match.job_id), score
            )

    async def _remove_from_cache(self, match: Match) -> None:
        """Remove match from all caches."""
        await self.redis.delete_match_detail(str(match.job_id), str(match.resume_id))
        await self.redis.remove_match_from_job_ranking(
            str(match.job_id), str(match.resume_id)
        )
        await self.redis.remove_recommendation_for_user(
            str(match.user_id), str(match.job_id)
        )
