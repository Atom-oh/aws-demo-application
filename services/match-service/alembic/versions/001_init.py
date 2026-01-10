"""Initial migration - create matches and match_feedback tables

Revision ID: 001_init
Revises:
Create Date: 2024-01-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_init'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'matches',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('job_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resume_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('overall_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('skill_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('experience_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('culture_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('score_breakdown', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ai_reasoning', sa.Text(), nullable=True),
        sa.Column('is_recommended', sa.Boolean(), server_default=sa.text('false'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('job_id', 'resume_id', name='uq_matches_job_resume')
    )

    op.create_index('ix_matches_job_id', 'matches', ['job_id'])
    op.create_index('ix_matches_user_id', 'matches', ['user_id'])
    op.create_index('ix_matches_overall_score', 'matches', ['overall_score'])

    op.create_table(
        'match_feedback',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('match_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('feedback_type', sa.String(length=20), nullable=True),
        sa.Column('feedback_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['match_id'], ['matches.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index('ix_match_feedback_match_id', 'match_feedback', ['match_id'])


def downgrade() -> None:
    op.drop_index('ix_match_feedback_match_id', table_name='match_feedback')
    op.drop_table('match_feedback')

    op.drop_index('ix_matches_overall_score', table_name='matches')
    op.drop_index('ix_matches_user_id', table_name='matches')
    op.drop_index('ix_matches_job_id', table_name='matches')
    op.drop_table('matches')
