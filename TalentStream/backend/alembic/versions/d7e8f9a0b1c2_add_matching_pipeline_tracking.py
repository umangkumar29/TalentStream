"""add matching pipeline tracking columns

Revision ID: d7e8f9a0b1c2
Revises: 6f4fdf73cbd5
Create Date: 2026-06-05 16:40:00.000000

Adds:
  job_requests:
    - matching_status      VARCHAR(20) DEFAULT 'idle'
    - matching_started_at  TIMESTAMPTZ
    - batches_total        INTEGER DEFAULT 0
    - batches_completed    INTEGER DEFAULT 0

  job_matches:
    - processing_status    VARCHAR(20) DEFAULT 'pending_llm'
    - cosine_score         NUMERIC(6,4)
    - cross_encoder_score  NUMERIC(6,4)
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = 'd7e8f9a0b1c2'
down_revision = '6f4fdf73cbd5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── job_requests: matching pipeline tracking ──────────────────────────────
    op.add_column('job_requests',
        sa.Column('matching_status', sa.String(20), nullable=False, server_default='idle')
    )
    op.add_column('job_requests',
        sa.Column('matching_started_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column('job_requests',
        sa.Column('batches_total', sa.Integer(), nullable=False, server_default='0')
    )
    op.add_column('job_requests',
        sa.Column('batches_completed', sa.Integer(), nullable=False, server_default='0')
    )

    # ── job_matches: per-candidate pipeline status and raw scores ─────────────
    op.add_column('job_matches',
        sa.Column('processing_status', sa.String(20), nullable=False, server_default='pending_llm')
    )
    op.add_column('job_matches',
        sa.Column('cosine_score', sa.Numeric(6, 4), nullable=True)
    )
    op.add_column('job_matches',
        sa.Column('cross_encoder_score', sa.Numeric(6, 4), nullable=True)
    )

    # ── Index for fast polling (status checks on job results page) ────────────
    op.create_index(
        'ix_job_matches_job_processing',
        'job_matches',
        ['job_id', 'processing_status']
    )
    op.create_index(
        'ix_job_requests_matching_status',
        'job_requests',
        ['matching_status']
    )


def downgrade() -> None:
    op.drop_index('ix_job_requests_matching_status', table_name='job_requests')
    op.drop_index('ix_job_matches_job_processing', table_name='job_matches')

    op.drop_column('job_matches', 'cross_encoder_score')
    op.drop_column('job_matches', 'cosine_score')
    op.drop_column('job_matches', 'processing_status')

    op.drop_column('job_requests', 'batches_completed')
    op.drop_column('job_requests', 'batches_total')
    op.drop_column('job_requests', 'matching_started_at')
    op.drop_column('job_requests', 'matching_status')
