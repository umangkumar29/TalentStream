from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ProjectCreate(BaseModel):
    name: str
    code: str
    manager_id: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    code: str
    manager_id: Optional[str]
    manager_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
