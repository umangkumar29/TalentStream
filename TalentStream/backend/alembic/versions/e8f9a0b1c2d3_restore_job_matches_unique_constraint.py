"""restore unique constraint on job_matches job_id candidate_id

Revision ID: e8f9a0b1c2d3
Revises: d7e8f9a0b1c2
Create Date: 2026-06-05 17:00:00.000000

The unique constraint on (job_id, candidate_id) was dropped in migration
6f4fdf73cbd5. This restores it so ON CONFLICT upserts in the workers work correctly.
"""
from alembic import op


revision = 'e8f9a0b1c2d3'
down_revision = 'd7e8f9a0b1c2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove any accidental duplicate rows first (safe — keeps the newest per pair)
    op.execute("""
        DELETE FROM job_matches a
        USING job_matches b
        WHERE a.id < b.id
          AND a.job_id = b.job_id
          AND a.candidate_id = b.candidate_id
    """)
    # Restore the unique constraint
    op.create_unique_constraint(
        'uq_job_matches_job_candidate',
        'job_matches',
        ['job_id', 'candidate_id']
    )


def downgrade() -> None:
    op.drop_constraint('uq_job_matches_job_candidate', 'job_matches', type_='unique')
