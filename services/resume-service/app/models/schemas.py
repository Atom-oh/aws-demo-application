"""Pydantic schemas for request/response validation."""

from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# Experience schemas
class ResumeExperienceBase(BaseModel):
    """Base schema for resume experience."""

    company_name: Optional[str] = Field(None, max_length=200)
    position: Optional[str] = Field(None, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    description: Optional[str] = None


class ResumeExperienceCreate(ResumeExperienceBase):
    """Schema for creating resume experience."""

    pass


class ResumeExperienceResponse(ResumeExperienceBase):
    """Schema for resume experience response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    resume_id: UUID


# Skill schemas
class ResumeSkillBase(BaseModel):
    """Base schema for resume skill."""

    skill_name: Optional[str] = Field(None, max_length=100)
    proficiency: Optional[str] = Field(None, max_length=20)
    years: Optional[int] = Field(None, ge=0)


class ResumeSkillCreate(ResumeSkillBase):
    """Schema for creating resume skill."""

    pass


class ResumeSkillResponse(ResumeSkillBase):
    """Schema for resume skill response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    resume_id: UUID


# Education schemas
class ResumeEducationBase(BaseModel):
    """Base schema for resume education."""

    school_name: Optional[str] = Field(None, max_length=200)
    degree: Optional[str] = Field(None, max_length=100)
    major: Optional[str] = Field(None, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False


class ResumeEducationCreate(ResumeEducationBase):
    """Schema for creating resume education."""

    pass


class ResumeEducationResponse(ResumeEducationBase):
    """Schema for resume education response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    resume_id: UUID


# Resume schemas
class ResumeBase(BaseModel):
    """Base schema for resume."""

    title: Optional[str] = Field(None, max_length=200)
    is_primary: bool = False


class ResumeCreate(ResumeBase):
    """Schema for creating resume."""

    user_id: UUID
    original_file_url: Optional[str] = Field(None, max_length=500)
    original_file_name: Optional[str] = Field(None, max_length=255)
    file_type: Optional[str] = Field(None, max_length=50)
    experiences: list[ResumeExperienceCreate] = []
    skills: list[ResumeSkillCreate] = []
    educations: list[ResumeEducationCreate] = []


class ResumeUpdate(BaseModel):
    """Schema for updating resume."""

    title: Optional[str] = Field(None, max_length=200)
    masked_content: Optional[str] = None
    parsed_content: Optional[dict[str, Any]] = None
    ai_summary: Optional[str] = None
    is_primary: Optional[bool] = None
    status: Optional[str] = Field(None, max_length=20)


class ResumeResponse(ResumeBase):
    """Schema for resume response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    original_file_url: Optional[str] = None
    original_file_name: Optional[str] = None
    file_type: Optional[str] = None
    masked_content: Optional[str] = None
    parsed_content: Optional[dict[str, Any]] = None
    ai_summary: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    experiences: list[ResumeExperienceResponse] = []
    skills: list[ResumeSkillResponse] = []
    educations: list[ResumeEducationResponse] = []


class ResumeListResponse(BaseModel):
    """Schema for paginated resume list response."""

    items: list[ResumeResponse]
    total: int
    page: int
    size: int
    pages: int
