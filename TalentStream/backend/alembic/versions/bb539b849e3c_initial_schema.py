"""initial schema

Revision ID: bb539b849e3c
Revises: 
Create Date: 2026-06-04 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision = 'bb539b849e3c'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # ─── ENUM Types ───
    op.execute("CREATE TYPE user_role AS ENUM ('Admin', 'VP', 'Program_Mgr', 'Project_Mgr', 'RMG')")
    op.execute("CREATE TYPE job_status AS ENUM ('open', 'in_review', 'closed')")
    op.execute("CREATE TYPE match_status AS ENUM ('pending', 'shortlisted', 'rejected')")
    op.execute("CREATE TYPE interview_status AS ENUM ('scheduled', 'cleared', 'rejected', 'pending')")
    op.execute("CREATE TYPE candidate_status AS ENUM ('bench', 'earmarked', 'interview_scheduled', 'selected_for_allocation', 'allocated', 'rejected')")

    user_role = postgresql.ENUM('Admin', 'VP', 'Program_Mgr', 'Project_Mgr', 'RMG', name='user_role', create_type=False)
    job_status = postgresql.ENUM('open', 'in_review', 'closed', name='job_status', create_type=False)
    match_status = postgresql.ENUM('pending', 'shortlisted', 'rejected', name='match_status', create_type=False)
    interview_status = postgresql.ENUM('scheduled', 'cleared', 'rejected', 'pending', name='interview_status', create_type=False)
    candidate_status = postgresql.ENUM('bench', 'earmarked', 'interview_scheduled', 'selected_for_allocation', 'allocated', 'rejected', name='candidate_status', create_type=False)

    # ─── Extensions ───
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "vector"')

    # ─── Tables ───
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=True),
        sa.Column('hashed_password', sa.String(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('role', user_role, nullable=False, server_default='RMG'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username')
    )

    op.create_table('candidates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('employee_id', sa.String(), nullable=True),
        sa.Column('status', candidate_status, nullable=False, server_default='bench'),
        sa.Column('skills', sa.Text(), nullable=True),
        sa.Column('experience_years', sa.Numeric(precision=4, scale=1), nullable=True),
        sa.Column('resume_url', sa.String(), nullable=True),
        sa.Column('resume_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('embedding', Vector(1536), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'))
    )

    op.create_table('projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('code', sa.String(), nullable=False),
        sa.Column('manager_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['manager_id'], ['users.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('code')
    )

    op.create_table('job_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('number_of_openings', sa.Integer(), server_default='1', nullable=False),
        sa.Column('department', sa.String(), nullable=True),
        sa.Column('role_category', sa.String(), nullable=False),
        sa.Column('top_k', sa.Numeric(precision=3), server_default='5'),
        sa.Column('status', job_status, nullable=False, server_default='open'),
        sa.Column('project_manager_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('embedding', Vector(1536), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_manager_id'], ['users.id'], ondelete='SET NULL')
    )

    op.create_table('job_matches',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('job_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('candidate_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('match_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('ai_justification', sa.Text(), nullable=True),
        sa.Column('status', match_status, nullable=False, server_default='pending'),
        sa.Column('l1_status', interview_status, nullable=True),
        sa.Column('l1_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('l2_status', interview_status, nullable=True),
        sa.Column('l2_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('hiring_decision', sa.Text(), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('rejection_category', sa.Text(), nullable=True),
        sa.Column('pm_notes', sa.Text(), nullable=True),
        sa.Column('is_hired', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['job_id'], ['job_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('job_id', 'candidate_id')
    )

    # ─── Seed Data ───
    op.execute(
        "INSERT INTO users (email, name, role) VALUES ('admin@talentstream.local', 'System Admin', 'Admin')"
    )

def downgrade() -> None:
    op.drop_table('job_matches')
    op.drop_table('job_requests')
    op.drop_table('projects')
    op.drop_table('candidates')
    op.drop_table('users')
    
    op.execute('DROP TYPE match_status')
    op.execute('DROP TYPE interview_status')
    op.execute('DROP TYPE job_status')
    op.execute('DROP TYPE candidate_status')
    op.execute('DROP TYPE user_role')
