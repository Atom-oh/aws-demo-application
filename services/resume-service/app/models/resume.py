"""SQLAlchemy models for resume entities."""

import uuid
from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Resume(Base):
    """Resume model."""

    __tablename__ = "resumes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    original_file_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    original_file_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    file_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    masked_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parsed_content: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="processing", index=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    experiences: Mapped[list["ResumeExperience"]] = relationship(
        "ResumeExperience",
        back_populates="resume",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    skills: Mapped[list["ResumeSkill"]] = relationship(
        "ResumeSkill",
        back_populates="resume",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    educations: Mapped[list["ResumeEducation"]] = relationship(
        "ResumeEducation",
        back_populates="resume",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ResumeExperience(Base):
    """Resume experience model."""

    __tablename__ = "resume_experiences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    company_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    position: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    resume: Mapped["Resume"] = relationship("Resume", back_populates="experiences")


class ResumeSkill(Base):
    """Resume skill model."""

    __tablename__ = "resume_skills"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skill_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    proficiency: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    years: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    resume: Mapped["Resume"] = relationship("Resume", back_populates="skills")


class ResumeEducation(Base):
    """Resume education model."""

    __tablename__ = "resume_educations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    school_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    degree: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    major: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    resume: Mapped["Resume"] = relationship("Resume", back_populates="educations")
