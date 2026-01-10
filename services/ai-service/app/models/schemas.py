"""Pydantic schemas for API request/response models."""

from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field


# Enums
class PIIMaskType(str, Enum):
    """Types of PII that can be detected/masked."""

    NAME = "NAME"
    EMAIL = "EMAIL"
    PHONE = "PHONE"
    SSN = "SSN"
    ADDRESS = "ADDRESS"
    DOB = "DOB"
    CREDIT_CARD = "CREDIT_CARD"
    PASSPORT = "PASSPORT"
    ID_NUMBER = "ID_NUMBER"


class SkillCategory(str, Enum):
    """Categories of skills."""

    TECHNICAL = "technical"
    SOFT = "soft"
    LANGUAGE = "language"
    CERTIFICATION = "certification"


class AnalysisType(str, Enum):
    """Types of resume analysis."""

    FULL = "full"
    SKILLS_ONLY = "skills_only"
    EXPERIENCE_ONLY = "experience_only"
    SUMMARY_ONLY = "summary_only"


class TaskStatus(str, Enum):
    """Status of an AI task."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# PII Schemas
class PIIEntity(BaseModel):
    """A detected PII entity."""

    type: PIIMaskType
    value: str
    start: Optional[int] = None
    end: Optional[int] = None


class PIIDetectRequest(BaseModel):
    """Request for PII detection."""

    text: str = Field(..., description="Text to analyze for PII")
    detect_types: Optional[List[PIIMaskType]] = Field(
        None, description="Types of PII to detect (all if not specified)"
    )


class PIIDetectResponse(BaseModel):
    """Response for PII detection."""

    task_id: UUID
    entities: List[PIIEntity]
    model_used: str
    tokens_used: int
    processing_time_ms: int


class PIIMaskRequest(BaseModel):
    """Request for PII masking."""

    text: str = Field(..., description="Text to mask")
    source_type: Optional[str] = Field(None, description="Source type (e.g., resume)")
    source_id: Optional[UUID] = Field(None, description="Source entity ID")
    mask_types: Optional[List[PIIMaskType]] = Field(
        None, description="Types of PII to mask (all if not specified)"
    )


class PIIMaskResponse(BaseModel):
    """Response for PII masking."""

    task_id: UUID
    original_text: str
    masked_text: str
    model_used: str
    tokens_used: int
    processing_time_ms: int


# Embedding Schemas
class EmbeddingRequest(BaseModel):
    """Request for generating embeddings."""

    text: str = Field(..., description="Text to embed")
    model: Optional[str] = Field(None, description="Model to use for embedding")


class EmbeddingResponse(BaseModel):
    """Response for embedding generation."""

    task_id: UUID
    embedding: List[float]
    dimensions: int
    model_used: str
    processing_time_ms: int


class BatchEmbeddingRequest(BaseModel):
    """Request for batch embedding generation."""

    texts: List[str] = Field(..., description="List of texts to embed")
    model: Optional[str] = Field(None, description="Model to use for embedding")


class BatchEmbeddingResponse(BaseModel):
    """Response for batch embedding generation."""

    task_id: UUID
    embeddings: List[List[float]]
    count: int
    dimensions: int
    model_used: str
    processing_time_ms: int


class JobEmbeddingCreate(BaseModel):
    """Request for creating job embeddings."""

    job_id: UUID
    title: str
    description: str
    requirements: Optional[str] = None


class JobEmbeddingResponse(BaseModel):
    """Response for job embedding creation."""

    task_id: UUID
    job_id: UUID
    chunk_count: int
    dimensions: int
    model_used: str
    processing_time_ms: int


class SimilarityResult(BaseModel):
    """A similarity search result."""

    job_id: UUID
    chunk_index: int
    chunk_text: str
    similarity_score: float


class SimilaritySearchRequest(BaseModel):
    """Request for similarity search."""

    query_text: str = Field(..., description="Query text to search for")
    top_k: int = Field(10, description="Number of results to return")
    threshold: float = Field(0.7, description="Minimum similarity threshold")


class SimilaritySearchResponse(BaseModel):
    """Response for similarity search."""

    task_id: UUID
    results: List[SimilarityResult]
    query_embedding_dimensions: int
    model_used: str
    processing_time_ms: int


# Analysis Schemas
class ExtractedSkill(BaseModel):
    """An extracted skill."""

    name: str
    category: SkillCategory
    proficiency: Optional[str] = None
    confidence: float = 0.8


class ExperienceInfo(BaseModel):
    """Extracted experience information."""

    company: str
    role: str
    duration: str
    achievements: List[str] = []


class EducationInfo(BaseModel):
    """Extracted education information."""

    institution: str
    degree: str
    field: str
    year: Optional[str] = None


class ResumeAnalysisRequest(BaseModel):
    """Request for resume analysis."""

    resume_id: UUID
    resume_text: str = Field(..., description="Full text of the resume")
    analysis_type: AnalysisType = Field(
        AnalysisType.FULL, description="Type of analysis to perform"
    )


class ResumeAnalysisResponse(BaseModel):
    """Response for resume analysis."""

    task_id: UUID
    resume_id: UUID
    summary: str
    skills: List[ExtractedSkill]
    experience: List[ExperienceInfo]
    education: List[EducationInfo]
    strengths: List[str]
    areas_for_improvement: List[str]
    overall_score: int
    model_used: str
    tokens_used: int
    processing_time_ms: int


class MatchResult(BaseModel):
    """Job match result details."""

    overall_score: int
    skill_match_percentage: float
    experience_match_percentage: float
    education_match_percentage: float
    matched_skills: List[str]
    missing_skills: List[str]
    hiring_recommendation: str


class JobMatchRequest(BaseModel):
    """Request for job matching."""

    resume_id: UUID
    job_id: UUID
    resume_text: str = Field(..., description="Full text of the resume")
    job_description: str = Field(..., description="Full job description")


class JobMatchResponse(BaseModel):
    """Response for job matching."""

    task_id: UUID
    resume_id: UUID
    job_id: UUID
    match_result: MatchResult
    recommendations: List[str]
    summary: str
    model_used: str
    tokens_used: int
    processing_time_ms: int


class SkillExtractionRequest(BaseModel):
    """Request for skill extraction."""

    text: str = Field(..., description="Text to extract skills from")
    skill_categories: Optional[List[SkillCategory]] = Field(
        None, description="Categories to extract (all if not specified)"
    )


class SkillExtractionResponse(BaseModel):
    """Response for skill extraction."""

    task_id: UUID
    skills: List[ExtractedSkill]
    skill_count: int
    model_used: str
    tokens_used: int
    processing_time_ms: int


# Task Schemas
class AITaskResponse(BaseModel):
    """Response for AI task status."""

    id: UUID
    task_type: str
    source_type: Optional[str] = None
    source_id: Optional[UUID] = None
    status: TaskStatus
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    model_used: Optional[str] = None
    tokens_used: Optional[int] = None
    processing_time_ms: Optional[int] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
