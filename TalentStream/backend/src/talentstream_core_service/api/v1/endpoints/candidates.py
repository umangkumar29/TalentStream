import uuid
import asyncio
from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, File, UploadFile, Depends, Form, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from talentstream_core_service.db.database import get_db
from talentstream_core_service.db.models import Candidate
from talentstream_core_service.services.cloud_service.azure_storage import azure_storage_service
from talentstream_core_service.services.pdf_parser import extract_text_from_pdf
from talentstream_core_service.services.ai_services.openai_service import openai_service
from talentstream_core_service.auth.auth import get_current_user, require_roles, CurrentUser
from talentstream_core_service.repositories.candidate_repository import CandidateRepository

router = APIRouter()

from talentstream_core_service.schemas.candidate import CandidateUpdate

@router.post("/candidates/upload-resume", summary="RMG / Admin: Upload and parse a resume PDF")
async def upload_resume(
    name: str = Form(...),
    email: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    # Only RMG and Admin can upload resumes
    current_user: CurrentUser = Depends(require_roles("RMG", "Admin")),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    file_bytes = await file.read()
    resume_url = azure_storage_service.upload_resume(file_bytes, file.filename)
    resume_text = extract_text_from_pdf(file_bytes)

    if not resume_text:
        raise HTTPException(status_code=422, detail="Could not extract text from the PDF.")

    # Generate embedding (zero-vector fallback if no API key configured)
    embedding_vector = openai_service.get_embedding(resume_text)

    # Parse resume into structured JSON schema
    resume_json = openai_service.parse_resume_to_json(resume_text)
    candidate_data = resume_json.get("candidate", {})

    # Extract fields from structured JSON
    extracted_name = candidate_data.get("name") or name or file.filename.split(".")[0]
    # Use AI-extracted email/phone; fall back to form value for email
    extracted_email = candidate_data.get("email") or email or None
    extracted_phone = candidate_data.get("phone") or None
    skills_list = candidate_data.get("skills", [])
    extracted_skills = ", ".join([str(s) for s in skills_list]) if skills_list else ""
    exp_raw = candidate_data.get("total_experience_years", 0)
    try:
        exp_float = float(exp_raw)
    except (ValueError, TypeError):
        exp_float = 0.0

    # Save to Postgres via SQLAlchemy
    new_candidate = Candidate(
        id=uuid.uuid4(),
        name=extracted_name,
        email=extracted_email,
        phone=extracted_phone,
        employee_id=None,  # Set manually by RMG after upload
        skills=extracted_skills,
        experience_years=exp_float,
        status="bench",
        resume_url=resume_url,
        resume_json=resume_json,
        embedding=embedding_vector,
        created_at=datetime.utcnow()
    )
    repo = CandidateRepository(db)
    repo.create(new_candidate)

    return {
        "status": "success",
        "message": f"Resume for {extracted_name} uploaded and parsed.",
        "candidate_id": str(new_candidate.id),
        "metadata": {
            "name": extracted_name,
            "skills": extracted_skills,
            "experience_years": exp_float,
            "summary": candidate_data.get("professional_summary", ""),
            "work_experience_count": len(candidate_data.get("work_experience", [])),
        },
        "uploaded_by": current_user.email,
    }



@router.get("/candidates", summary="List all candidates (restricted by role)")
def list_candidates(
    search: str | None = None,
    status_filter: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    repo = CandidateRepository(db)
    candidates = repo.get_all(search=search, status_filter=status_filter, skip=skip, limit=limit)

    return [
        {
            "id": str(c.id),
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "employee_id": c.employee_id,
            "skills": c.skills,
            "experience_years": float(c.experience_years) if c.experience_years else 0.0,
            "status": getattr(c.status, "value", str(c.status)) if c.status else "bench",
            "resume_url": c.resume_url,
            "has_embedding": c.embedding is not None,
            "created_at": c.created_at.isoformat(),
            "overall_summary": c.resume_json.get("candidate", {}).get("professional_summary", "") if c.resume_json else "",
            "project_summary": "\n".join([ach for exp in c.resume_json.get("candidate", {}).get("work_experience", []) for ach in exp.get("key_achievements", [])]) if c.resume_json else "",
            "role_category": (c.resume_json.get("candidate", {}).get("work_experience", [])[0].get("role", "General") if c.resume_json and c.resume_json.get("candidate", {}).get("work_experience") else "General") if c.resume_json else "General",
        }
        for c in candidates
    ]


@router.patch("/candidates/{candidate_id}", summary="Update candidate details")
def update_candidate(
    candidate_id: str,
    payload: CandidateUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("RMG", "Admin")),
):
    repo = CandidateRepository(db)
    candidate = repo.get_by_id(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(candidate, key, value)

    repo.update(candidate)

    return {"status": "success", "message": "Candidate updated successfully"}


@router.delete("/candidates/{candidate_id}", summary="Delete a candidate")
def delete_candidate(
    candidate_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("RMG", "Admin")),
):
    repo = CandidateRepository(db)
    candidate = repo.get_by_id(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    repo.delete(candidate)

    return {"status": "success", "message": "Candidate deleted successfully"}
