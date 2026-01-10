"""Match API routes."""

import math
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import get_redis, RedisClient
from app.models.schemas import (
    MatchCreate,
    MatchUpdate,
    MatchResponse,
    MatchListResponse,
    MatchScoreRequest,
    MatchScoreResponse,
    MatchFeedbackCreate,
    MatchFeedbackResponse,
    TopMatchesResponse,
    RecommendedJobsResponse,
)
from app.services.match_service import MatchService

router = APIRouter()


def get_service(
    session: AsyncSession = Depends(get_db),
    redis: RedisClient = Depends(get_redis),
) -> MatchService:
    """Dependency for getting match service."""
    return MatchService(session, redis)


@router.post(
    "",
    response_model=MatchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new match",
)
async def create_match(
    data: MatchCreate,
    service: MatchService = Depends(get_service),
) -> MatchResponse:
    """Create a new match record."""
    match = await service.create_match(data)
    return MatchResponse.model_validate(match)


@router.get(
    "/{match_id}",
    response_model=MatchResponse,
    summary="Get a match by ID",
)
async def get_match(
    match_id: UUID,
    service: MatchService = Depends(get_service),
) -> MatchResponse:
    """Get a match by its ID."""
    match = await service.get_match(match_id)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match {match_id} not found",
        )
    return MatchResponse.model_validate(match)


@router.get(
    "/job/{job_id}/resume/{resume_id}",
    response_model=MatchResponse,
    summary="Get match by job and resume",
)
async def get_match_by_job_and_resume(
    job_id: UUID,
    resume_id: UUID,
    service: MatchService = Depends(get_service),
) -> MatchResponse:
    """Get a match by job and resume IDs."""
    match = await service.get_match_by_job_and_resume(job_id, resume_id)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match for job {job_id} and resume {resume_id} not found",
        )
    return MatchResponse.model_validate(match)


@router.get(
    "/job/{job_id}",
    response_model=MatchListResponse,
    summary="List matches for a job",
)
async def list_matches_for_job(
    job_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    min_score: Optional[float] = Query(None, ge=0, le=100),
    service: MatchService = Depends(get_service),
) -> MatchListResponse:
    """Get all matches for a job with pagination."""
    matches, total = await service.get_matches_for_job(
        job_id, page=page, page_size=page_size, min_score=min_score
    )
    return MatchListResponse(
        items=[MatchResponse.model_validate(m) for m in matches],
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get(
    "/user/{user_id}",
    response_model=MatchListResponse,
    summary="List matches for a user",
)
async def list_matches_for_user(
    user_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    recommended_only: bool = Query(False),
    service: MatchService = Depends(get_service),
) -> MatchListResponse:
    """Get all matches for a user with pagination."""
    matches, total = await service.get_matches_for_user(
        user_id,
        page=page,
        page_size=page_size,
        recommended_only=recommended_only,
    )
    return MatchListResponse(
        items=[MatchResponse.model_validate(m) for m in matches],
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.patch(
    "/{match_id}",
    response_model=MatchResponse,
    summary="Update a match",
)
async def update_match(
    match_id: UUID,
    data: MatchUpdate,
    service: MatchService = Depends(get_service),
) -> MatchResponse:
    """Update a match record."""
    match = await service.update_match(match_id, data)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match {match_id} not found",
        )
    return MatchResponse.model_validate(match)


@router.delete(
    "/{match_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a match",
)
async def delete_match(
    match_id: UUID,
    service: MatchService = Depends(get_service),
) -> None:
    """Delete a match record."""
    deleted = await service.delete_match(match_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match {match_id} not found",
        )


@router.post(
    "/score",
    response_model=MatchScoreResponse,
    summary="Calculate match score",
)
async def calculate_match_score(
    request: MatchScoreRequest,
    service: MatchService = Depends(get_service),
) -> MatchScoreResponse:
    """Calculate or retrieve match score for a job-resume pair."""
    return await service.calculate_match_score(request)


@router.get(
    "/job/{job_id}/top",
    response_model=TopMatchesResponse,
    summary="Get top matches for a job",
)
async def get_top_matches_for_job(
    job_id: UUID,
    limit: int = Query(10, ge=1, le=100),
    service: MatchService = Depends(get_service),
) -> TopMatchesResponse:
    """Get top matches for a job from cache."""
    return await service.get_top_matches_for_job(job_id, limit)


@router.get(
    "/user/{user_id}/recommended",
    response_model=RecommendedJobsResponse,
    summary="Get recommended jobs for a user",
)
async def get_recommended_jobs_for_user(
    user_id: UUID,
    limit: int = Query(10, ge=1, le=100),
    service: MatchService = Depends(get_service),
) -> RecommendedJobsResponse:
    """Get recommended jobs for a user from cache."""
    return await service.get_recommended_jobs_for_user(user_id, limit)


@router.post(
    "/feedback",
    response_model=MatchFeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add feedback for a match",
)
async def add_match_feedback(
    data: MatchFeedbackCreate,
    service: MatchService = Depends(get_service),
    session: AsyncSession = Depends(get_db),
) -> MatchFeedbackResponse:
    """Add feedback for a match."""
    from app.repositories.match_repository import MatchRepository

    success = await service.add_feedback(data)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match {data.match_id} not found",
        )

    # Fetch the created feedback
    repo = MatchRepository(session)
    feedbacks = await repo.get_feedback_by_match_id(data.match_id)
    if not feedbacks:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create feedback",
        )
    return MatchFeedbackResponse.model_validate(feedbacks[0])
