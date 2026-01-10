"""Initial migration for AI service tables.

Revision ID: 001
Revises:
Create Date: 2024-01-15

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create initial tables for AI service."""

    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # Create ai_tasks table
    op.create_table(
        "ai_tasks",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("task_type", sa.String(50), nullable=False),
        sa.Column("source_type", sa.String(50), nullable=True),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(20), server_default="pending", nullable=True),
        sa.Column("input_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("output_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("model_used", sa.String(100), nullable=True),
        sa.Column("tokens_used", sa.Integer(), nullable=True),
        sa.Column("processing_time_ms", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes for ai_tasks
    op.create_index("ix_ai_tasks_task_type", "ai_tasks", ["task_type"])
    op.create_index("ix_ai_tasks_source_type", "ai_tasks", ["source_type"])
    op.create_index("ix_ai_tasks_source_id", "ai_tasks", ["source_id"])
    op.create_index("ix_ai_tasks_status", "ai_tasks", ["status"])
    op.create_index("ix_ai_tasks_created_at", "ai_tasks", ["created_at"])

    # Create job_embeddings table with vector column
    op.execute(
        """
        CREATE TABLE job_embeddings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            job_id UUID NOT NULL,
            chunk_index INT,
            chunk_text TEXT,
            embedding vector(1536),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # Create indexes for job_embeddings
    op.create_index("ix_job_embeddings_job_id", "job_embeddings", ["job_id"])

    # Create HNSW index for vector similarity search
    op.execute(
        """
        CREATE INDEX ix_job_embeddings_embedding_hnsw
        ON job_embeddings
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
        """
    )


def downgrade() -> None:
    """Drop AI service tables."""
    op.drop_index("ix_job_embeddings_embedding_hnsw", table_name="job_embeddings")
    op.drop_index("ix_job_embeddings_job_id", table_name="job_embeddings")
    op.drop_table("job_embeddings")

    op.drop_index("ix_ai_tasks_created_at", table_name="ai_tasks")
    op.drop_index("ix_ai_tasks_status", table_name="ai_tasks")
    op.drop_index("ix_ai_tasks_source_id", table_name="ai_tasks")
    op.drop_index("ix_ai_tasks_source_type", table_name="ai_tasks")
    op.drop_index("ix_ai_tasks_task_type", table_name="ai_tasks")
    op.drop_table("ai_tasks")

    op.execute("DROP EXTENSION IF EXISTS vector")
