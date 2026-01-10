"""SQLAlchemy models for match service."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, DeclarativeBase


class Base(DeclarativeBase):
    """Base class for SQLAlchemy models."""

    pass


class Match(Base):
    """Match model representing job-resume matching results."""

    __tablename__ = "matches"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    job_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    resume_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)

    overall_score: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=5, scale=2), nullable=True
    )
    skill_score: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=5, scale=2), nullable=True
    )
    experience_score: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=5, scale=2), nullable=True
    )
    culture_score: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=5, scale=2), nullable=True
    )

    score_breakdown: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSONB, nullable=True
    )
    ai_reasoning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_recommended: Mapped[bool] = mapped_column(
        Boolean, server_default="false", default=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )

    # Relationships
    feedbacks: Mapped[list["MatchFeedback"]] = relationship(
        "MatchFeedback", back_populates="match", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("job_id", "resume_id", name="uq_matches_job_resume"),
        Index("ix_matches_job_id", "job_id"),
        Index("ix_matches_user_id", "user_id"),
        Index("ix_matches_overall_score", "overall_score"),
    )

    def __repr__(self) -> str:
        return f"<Match(id={self.id}, job_id={self.job_id}, score={self.overall_score})>"


class MatchFeedback(Base):
    """Feedback model for match results."""

    __tablename__ = "match_feedback"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    match_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("matches.id", ondelete="CASCADE"),
        nullable=True,
    )
    feedback_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    feedback_by: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp()
    )

    # Relationships
    match: Mapped[Optional["Match"]] = relationship("Match", back_populates="feedbacks")

    __table_args__ = (Index("ix_match_feedback_match_id", "match_id"),)

    def __repr__(self) -> str:
        return f"<MatchFeedback(id={self.id}, type={self.feedback_type})>"
