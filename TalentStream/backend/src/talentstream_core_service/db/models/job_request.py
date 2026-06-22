import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, Numeric, Integer, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from talentstream_core_service.db.database import Base


class JobStatus(str, enum.Enum):
    open = "open"
    in_review = "in_review"
    closed = "closed"


class MatchingStatus(str, enum.Enum):
    idle = "idle"
    running = "running"
    completed = "completed"
    failed = "failed"


class JobRequest(Base):
    __tablename__ = "job_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    number_of_openings = Column(Integer, default=1)
    min_experience_years = Column(Numeric, nullable=True)
    top_k = Column(Numeric(precision=3), default=5)
    status = Column(SAEnum(JobStatus, name="job_status"), nullable=False, default=JobStatus.open)
    project_manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    embedding = Column(Vector(1536))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    last_activity_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # ── Async matching pipeline tracking ──────────────────────────────────────
    matching_status = Column(String(20), nullable=False, default="idle")   # idle|running|completed|failed
    matching_started_at = Column(DateTime(timezone=True), nullable=True)   # for timeout detection
    batches_total = Column(Integer, nullable=False, default=0)             # set by Worker 1
    batches_completed = Column(Integer, nullable=False, default=0)         # incremented by Worker 2
