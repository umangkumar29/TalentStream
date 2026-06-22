from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CreateJobRequest(BaseModel):
    title: str
    description: str
    min_experience_years: Optional[float] = None
    top_k: int = 5
    num_resources: int = 1

class UpdateMatchStatusRequest(BaseModel):
    status: str  # "shortlisted" | "rejected" | "pending"

class GenerateJDRequest(BaseModel):
    title: Optional[str] = None
    keywords: str

class ScheduleInterviewRequest(BaseModel):
    match_id: str
    stage: str
    status: str
    date: Optional[datetime] = None

class UpdateHiringDecisionRequest(BaseModel):
    match_id: str
    decision: str
    rejection_category: Optional[str] = None
    rejection_reason: Optional[str] = None
    pm_notes: Optional[str] = None
