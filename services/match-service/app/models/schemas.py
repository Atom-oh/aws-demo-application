"""Pydantic schemas for match service API."""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FeedbackType(str, Enum):
    """Feedback types for matches."""

    HELPFUL = "helpful"
    NOT_HELPFUL = "not_helpful"
    HIRED = "hired"
    REJECTED = "rejected"
    INTERVIEWING = "interviewing"


# Base schemas
class MatchBase(BaseModel):
    """Base schema for match data."""

    job_id: UUID
    resume_id: UUID
    user_id: UUID


class MatchScores(BaseModel):
    """Score breakdown for a match."""

    overall_score: Optional[Decimal] = Field(None, ge=0, le=100)
    skill_score: Optional[Decimal] = Field(None, ge=0, le=100)
    experience_score: Optional[Decimal] = Field(None, ge=0, le=100)
    culture_score: Optional[Decimal] = Field(None, ge=0, le=100)
    score_breakdown: Optional[dict[str, Any]] = None
    ai_reasoning: Optional[str] = None


# Request schemas
class MatchCreate(MatchBase):
    """Schema for creating a new match."""

    pass


class MatchUpdate(BaseModel):
    """Schema for updating match scores."""

    overall_score: Optional[Decimal] = Field(None, ge=0, le=100)
    skill_score: Optional[Decimal] = Field(None, ge=0, le=100)
    experience_score: Optional[Decimal] = Field(None, ge=0, le=100)
    culture_score: Optional[Decimal] = Field(None, ge=0, le=100)
    score_breakdown: Optional[dict[str, Any]] = None
    ai_reasoning: Optional[str] = None
    is_recommended: Optional[bool] = None


class MatchScoreRequest(BaseModel):
    """Request schema for calculating match score."""

    job_id: UUID
    resume_id: UUID
    user_id: UUID
    force_recalculate: bool = False


class MatchFeedbackCreate(BaseModel):
    """Schema for creating match feedback."""

    match_id: UUID
    feedback_type: FeedbackType
    feedback_by: UUID


# Response schemas
class MatchFeedbackResponse(BaseModel):
    """Response schema for match feedback."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    match_id: Optional[UUID]
    feedback_type: Optional[str]
    feedback_by: Optional[UUID]
    created_at: datetime


class MatchResponse(MatchBase, MatchScores):
    """Response schema for a single match."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_recommended: bool
    created_at: datetime
    updated_at: datetime
    feedbacks: list[MatchFeedbackResponse] = []


class MatchListResponse(BaseModel):
    """Response schema for list of matches."""

    items: list[MatchResponse]
    total: int
    page: int
    page_size: int
    pages: int


class MatchScoreResponse(BaseModel):
    """Response schema for match score calculation."""

    match_id: UUID
    job_id: UUID
    resume_id: UUID
    overall_score: Decimal
    skill_score: Decimal
    experience_score: Decimal
    culture_score: Decimal
    score_breakdown: dict[str, Any]
    ai_reasoning: str
    is_recommended: bool
    is_cached: bool = False


class TopMatchItem(BaseModel):
    """Single item in top matches list."""

    resume_id: UUID
    score: float


class TopMatchesResponse(BaseModel):
    """Response schema for top matches for a job."""

    job_id: UUID
    matches: list[TopMatchItem]
    total: int


class RecommendedJobItem(BaseModel):
    """Single item in recommended jobs list."""

    job_id: UUID
    score: float


class RecommendedJobsResponse(BaseModel):
    """Response schema for recommended jobs for a user."""

    user_id: UUID
    jobs: list[RecommendedJobItem]
    total: int


class HealthResponse(BaseModel):
    """Response schema for health check."""

    status: str
    service: str
    version: str
    database: str
    redis: str
