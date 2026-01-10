"""Models package for match service."""

from app.models.match import Match, MatchFeedback, Base
from app.models.schemas import (
    MatchCreate,
    MatchUpdate,
    MatchResponse,
    MatchListResponse,
    MatchFeedbackCreate,
    MatchFeedbackResponse,
    MatchScoreRequest,
    MatchScoreResponse,
    TopMatchesResponse,
    RecommendedJobsResponse,
)

__all__ = [
    "Match",
    "MatchFeedback",
    "Base",
    "MatchCreate",
    "MatchUpdate",
    "MatchResponse",
    "MatchListResponse",
    "MatchFeedbackCreate",
    "MatchFeedbackResponse",
    "MatchScoreRequest",
    "MatchScoreResponse",
    "TopMatchesResponse",
    "RecommendedJobsResponse",
]
