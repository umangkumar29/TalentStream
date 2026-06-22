import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, Numeric, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from talentstream_core_service.db.database import Base


class MatchStatus(str, enum.Enum):
    pending = "pending"
    shortlisted = "shortlisted"
    rejected = "rejected"


class InterviewStatus(str, enum.Enum):
    scheduled = "scheduled"
    cleared = "cleared"
    rejected = "rejected"
    pending = "pending"


class ProcessingStatus(str, enum.Enum):
    """Tracks the LLM pipeline state — separate from the PM's action status."""
    pending_llm = "pending_llm"   # W1 inserted row, awaiting LLM evaluation
    evaluated = "evaluated"        # W2 completed LLM scoring
    cache_hit = "cache_hit"        # re-trigger: reused existing score
    failed = "failed"              # LLM exhausted retries


class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("job_requests.id", ondelete="CASCADE"))
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"))

    # ── PM action status (shortlist / reject decision) ────────────────────────
    status = Column(SAEnum(MatchStatus, name="match_status"), nullable=False, default=MatchStatus.pending)

    # ── LLM pipeline processing status ───────────────────────────────────────
    processing_status = Column(String(20), nullable=False, default="pending_llm")

    # ── Scores (set by workers) ───────────────────────────────────────────────
    cosine_score = Column(Numeric(6, 4), nullable=True)          # Tier 1: pgvector similarity (0-1)
    cross_encoder_score = Column(Numeric(6, 4), nullable=True)   # Tier 2: BGE reranker score
    match_score = Column(Numeric(5, 2), nullable=True)           # Tier 3: LLM 0-100 score

    # ── LLM output ────────────────────────────────────────────────────────────
    ai_justification = Column(Text, nullable=True)

    # ── Interview tracking (PM actions) ──────────────────────────────────────
    l1_status = Column(SAEnum(InterviewStatus, name="interview_status"), nullable=True)
    l1_date = Column(DateTime(timezone=True), nullable=True)
    l2_status = Column(SAEnum(InterviewStatus, name="interview_status"), nullable=True)
    l2_date = Column(DateTime(timezone=True), nullable=True)
    hiring_decision = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    rejection_category = Column(Text, nullable=True)
    pm_notes = Column(Text, nullable=True)
    is_hired = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
