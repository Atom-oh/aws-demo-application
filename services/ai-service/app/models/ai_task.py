"""SQLAlchemy models for AI tasks and embeddings."""

from datetime import datetime
from typing import Optional, Dict, Any, List
import uuid

from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    DateTime,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector

from app.core.database import Base


class AITask(Base):
    """Model for AI task tracking."""

    __tablename__ = "ai_tasks"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    task_type = Column(String(50), nullable=False, index=True)
    source_type = Column(String(50), nullable=True, index=True)
    source_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    status = Column(String(20), default="pending", index=True)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    model_used = Column(String(100), nullable=True)
    tokens_used = Column(Integer, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<AITask(id={self.id}, type={self.task_type}, status={self.status})>"


class JobEmbedding(Base):
    """Model for job posting embeddings."""

    __tablename__ = "job_embeddings"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    job_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=True)
    chunk_text = Column(Text, nullable=True)
    embedding = Column(Vector(1536), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<JobEmbedding(id={self.id}, job_id={self.job_id}, chunk={self.chunk_index})>"
