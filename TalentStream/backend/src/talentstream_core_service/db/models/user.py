import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from talentstream_core_service.db.database import Base

class UserRole(str, enum.Enum):
    Admin = "Admin"
    VP = "VP"
    Program_Mgr = "Program_Mgr"
    Project_Mgr = "Project_Mgr"
    RMG = "RMG"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, nullable=False, unique=True)
    username = Column(String, nullable=True, unique=True)
    hashed_password = Column(String, nullable=True)
    name = Column(String, nullable=False)
    role = Column(SAEnum(UserRole, name="user_role"), nullable=False, default=UserRole.RMG)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
