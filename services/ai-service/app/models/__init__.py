"""Data models."""

from app.models.ai_task import AITask, JobEmbedding
from app.models.schemas import (
    PIIMaskRequest,
    PIIMaskResponse,
    PIIDetectRequest,
    PIIDetectResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    ResumeAnalysisRequest,
    ResumeAnalysisResponse,
)

__all__ = [
    "AITask",
    "JobEmbedding",
    "PIIMaskRequest",
    "PIIMaskResponse",
    "PIIDetectRequest",
    "PIIDetectResponse",
    "EmbeddingRequest",
    "EmbeddingResponse",
    "ResumeAnalysisRequest",
    "ResumeAnalysisResponse",
]
