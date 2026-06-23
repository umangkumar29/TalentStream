import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from talentstream_core_service.db.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_role = Column(String, nullable=False)          # "RMG", "Project_Mgr", etc.
    type = Column(String(50), nullable=False)             # "job_fulfilled"
    title = Column(String(200), nullable=False)           # Short title
    message = Column(Text, nullable=False)                # Full message
    metadata_json = Column(Text, nullable=True)           # JSON: { job_id, job_title, candidate_name }
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
