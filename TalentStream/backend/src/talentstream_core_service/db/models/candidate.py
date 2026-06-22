import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, Numeric, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
from talentstream_core_service.db.database import Base

class CandidateStatus(str, enum.Enum):
    bench = "bench"
    earmarked = "earmarked"
    interview_scheduled = "interview_scheduled"
    selected_for_allocation = "selected_for_allocation"
    allocated = "allocated"
    rejected = "rejected"

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    employee_id = Column(String, nullable=True)  # Set manually by RMG; optionally extracted from resume
    status = Column(SAEnum(CandidateStatus, name="candidate_status"), nullable=False, default=CandidateStatus.bench)
    skills = Column(Text)
    experience_years = Column(Numeric(4, 1))
    resume_url = Column(String)
    resume_json = Column(JSONB)
    embedding = Column(Vector(1536))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

