from pydantic import BaseModel

class CandidateUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    employee_id: str | None = None
    skills: str | None = None
    experience_years: float | None = None
    status: str | None = None
