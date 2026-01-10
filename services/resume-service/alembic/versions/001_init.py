"""Initial migration - create resume tables

Revision ID: 001_init
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_init"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # Create resumes table
    op.create_table(
        "resumes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(200), nullable=True),
        sa.Column("original_file_url", sa.String(500), nullable=True),
        sa.Column("original_file_name", sa.String(255), nullable=True),
        sa.Column("file_type", sa.String(50), nullable=True),
        sa.Column("masked_content", sa.Text(), nullable=True),
        sa.Column("parsed_content", postgresql.JSONB(), nullable=True),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        sa.Column("is_primary", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("status", sa.String(20), server_default="processing"),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.TIMESTAMP(), server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_resumes_user_id", "resumes", ["user_id"])
    op.create_index("ix_resumes_status", "resumes", ["status"])

    # Create resume_experiences table
    op.create_table(
        "resume_experiences",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("resume_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company_name", sa.String(200), nullable=True),
        sa.Column("position", sa.String(100), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("is_current", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("description", sa.Text(), nullable=True),
    )
    op.create_index("ix_resume_experiences_resume_id", "resume_experiences", ["resume_id"])

    # Create resume_skills table
    op.create_table(
        "resume_skills",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("resume_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("skill_name", sa.String(100), nullable=True),
        sa.Column("proficiency", sa.String(20), nullable=True),
        sa.Column("years", sa.Integer(), nullable=True),
    )
    op.create_index("ix_resume_skills_resume_id", "resume_skills", ["resume_id"])

    # Create resume_educations table
    op.create_table(
        "resume_educations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("resume_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("school_name", sa.String(200), nullable=True),
        sa.Column("degree", sa.String(100), nullable=True),
        sa.Column("major", sa.String(100), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("is_current", sa.Boolean(), server_default=sa.text("false")),
    )
    op.create_index("ix_resume_educations_resume_id", "resume_educations", ["resume_id"])


def downgrade() -> None:
    op.drop_table("resume_educations")
    op.drop_table("resume_skills")
    op.drop_table("resume_experiences")
    op.drop_table("resumes")
    op.execute("DROP EXTENSION IF EXISTS vector")
