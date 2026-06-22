import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from talentstream_core_service.db.database import get_db
from talentstream_core_service.db.models import JobRequest, JobStatus, Candidate, CandidateStatus, Project
from talentstream_core_service.auth.auth import get_current_user, require_roles, CurrentUser
from talentstream_core_service.services.ai_services.openai_service import openai_service
from talentstream_core_service.repositories.job_repository import JobRepository
from talentstream_core_service.schemas.job import (
    CreateJobRequest, UpdateMatchStatusRequest, GenerateJDRequest,
    ScheduleInterviewRequest, UpdateHiringDecisionRequest
)

router = APIRouter()

# NOTE: _run_rag_in_background is intentionally kept as a fallback.
# The primary matching path now goes through RabbitMQ (trigger_matching endpoint).
def _run_rag_in_background(job_id: str, db: Session):
    try:
        from talentstream_core_service.services.ranking.rag_engine import rag_engine
        rag_engine.run(job_id=job_id, db=db)
    except Exception as exc:
        print(f"[jobs] RAG pipeline error for job {job_id}: {exc}")


@router.post("/jobs", summary="PM / Program Mgr / Admin: Create a job request")
def create_job(
    payload: CreateJobRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(
        require_roles("Project_Mgr", "Program_Mgr", "Admin")
    ),
):
    # 1. Create embedding of the JD description
    embedding_vector = openai_service.get_embedding(payload.description)

    pm_id = None
    try:
        if current_user.id:
            pm_id = uuid.UUID(current_user.id)
    except (ValueError, TypeError):
        pass

    if pm_id is None:
        from talentstream_core_service.db.models.user import User
        fallback_user = db.query(User).first()
        if fallback_user:
            pm_id = fallback_user.id

    job = JobRequest(
        id=uuid.uuid4(),
        project_manager_id=pm_id,
        title=payload.title,
        description=payload.description,
        min_experience_years=payload.min_experience_years,
        top_k=payload.top_k,
        number_of_openings=payload.num_resources,
        embedding=embedding_vector,
        status=JobStatus.open,
    )
    repo = JobRepository(db)
    repo.create(job)

    # Note: Matching is NO LONGER triggered here automatically!

    return {
        "status": "created",
        "job_id": str(job.id),
        "created_by": current_user.email,
        "message": "Job request created. Embedding generated successfully. AI matching must be triggered manually.",
    }

@router.post("/jobs/{job_id}/match", summary="PM: Trigger async AI matching via RabbitMQ", status_code=202)
def trigger_matching(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("Project_Mgr", "Program_Mgr", "Admin", "RMG")),
):
    """
    Publishes a single lightweight message to the candidate_evaluation RabbitMQ queue.
    Worker 1 (embedding_filter_worker) consumes it, runs pgvector HNSW search,
    chunks top-K candidates into batches of 5, and publishes to candidate_shortlisted.
    Worker 2 (llm_evaluation_worker) picks up each batch and runs one LLM call per batch.
    Results accumulate in job_matches ordered by match_score — poll GET /jobs/{id}/results.
    """
    from talentstream_core_service.services.rabbitmq_publisher import rabbitmq_publisher

    repo = JobRepository(db)
    job = repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.last_activity_at = datetime.utcnow()
    db.commit()

    try:
        rabbitmq_publisher.publish_match_trigger(
            job_id=str(job.id),
            # Use the PM assigned to the job, falling back to whoever created it.
            # Do NOT use current_user — the PM who assigned is the authority here.
            pm_id=str(job.project_manager_id or job.creator_id) if (job.project_manager_id or job.creator_id) else None,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Could not reach RabbitMQ broker. Is it running? ({exc})"
        )

    return {
        "status": "queued",
        "message": "Match job published to queue. Results will appear incrementally — poll GET /jobs/{job_id}/results.",
        "job_id": job_id,
    }


@router.post("/jobs/{job_id}/retrigger", summary="PM: Re-trigger async AI matching", status_code=202)
def retrigger_matching(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("Project_Mgr", "Program_Mgr", "Admin", "RMG")),
):
    from talentstream_core_service.services.rabbitmq_publisher import rabbitmq_publisher
    from talentstream_core_service.db.models import JobMatch

    repo = JobRepository(db)
    job = repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Clear previous matches
    db.query(JobMatch).filter(JobMatch.job_id == job.id).delete()
    
    # Reset tracking state
    job.matching_status = "running"
    job.batches_total = 0
    job.batches_completed = 0
    job.last_activity_at = datetime.utcnow()
    db.commit()

    try:
        rabbitmq_publisher.publish_match_trigger(
            job_id=str(job.id),
            pm_id=str(job.project_manager_id or job.creator_id) if (job.project_manager_id or job.creator_id) else None,
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Broker error: {exc}")

    return {"status": "queued", "job_id": job_id}

@router.get("/jobs", summary="List job requests")
def list_jobs(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    repo = JobRepository(db)
    jobs = repo.list_all()
    results = []
    needs_commit = False
    
    for j in jobs:
        fulfilled_count = repo.get_fulfilled_count_by_job_id(str(j.id))
        
        # Self-heal status based on actual fulfillment
        if fulfilled_count >= j.number_of_openings and j.status != "closed":
            j.status = "closed"
            needs_commit = True
        elif fulfilled_count < j.number_of_openings and j.status == "closed":
            j.status = "open"
            needs_commit = True
            
        results.append({
            "id": str(j.id),
            "title": j.title,
            "min_experience_years": j.min_experience_years,
            "status": j.status,
            "created_at": j.created_at.isoformat(),
            "last_activity_at": j.last_activity_at.isoformat() if getattr(j, "last_activity_at", None) else j.created_at.isoformat(),
            "match_count": repo.get_match_count_by_job_id(str(j.id)),
            "matching_status": getattr(j, "matching_status", "idle"),
            "num_resources": j.number_of_openings,
            "fulfilled_count": fulfilled_count,
            "department": getattr(j, "department", None),
            "role_category": getattr(j, "role_category", "Unknown")
        })
        
    if needs_commit:
        db.commit()
        
    return results


@router.get("/jobs/{job_id}", summary="Get job request details by ID")
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    repo = JobRepository(db)
    job = repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    project_name = None
    project_code = None
    if job.project_id:
        proj = db.query(Project).filter(Project.id == job.project_id).first()
        if proj:
            project_name = proj.name
            project_code = proj.code
            
    return {
        "id": str(job.id),
        "title": job.title,
        "description": job.description,
        "min_experience_years": job.min_experience_years,
        "num_resources": job.number_of_openings,
        "status": job.status,
        "created_at": job.created_at.isoformat(),
        "last_activity_at": job.last_activity_at.isoformat() if getattr(job, "last_activity_at", None) else job.created_at.isoformat(),
        "top_k": job.top_k,
        "project_manager_id": job.project_manager_id,
        "project_name": project_name,
        "project_code": project_code
    }


@router.get("/jobs/{job_id}/matches", summary="Get AI match results for a job")
def get_matches(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    # VP gets read-only; Project/Program Mgr and Admin get full access
    repo = JobRepository(db)
    matches = repo.get_matches_by_job_id(job_id)
    return [
        {
            "id": str(m.id),
            "candidate_id": str(m.candidate_id),
            "match_score": float(m.match_score) if m.match_score else None,
            "ai_justification": m.ai_justification,
            "status": m.status,
        }
        for m in matches
    ]


@router.patch("/matches/{match_id}/status", summary="PM: Update shortlist / reject status")
def update_match_status(
    match_id: str,
    payload: UpdateMatchStatusRequest,
    db: Session = Depends(get_db),
    # Only PM and Admin can shortlist/reject
    current_user: CurrentUser = Depends(require_roles("Project_Mgr", "Program_Mgr", "Admin")),
):
    allowed = {"pending", "shortlisted", "rejected"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {allowed}")

    repo = JobRepository(db)
    match = repo.get_match_by_id(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match record not found.")

    match.status = payload.status
    
    # Update job last_activity_at
    job = db.query(JobRequest).filter(JobRequest.id == match.job_id).first()
    if job:
        job.last_activity_at = datetime.utcnow()
    
    candidate = db.query(Candidate).filter(Candidate.id == match.candidate_id).first()
    if candidate:
        if payload.status == "shortlisted":
            candidate.status = CandidateStatus.interview_scheduled
        elif payload.status == "rejected":
            candidate.status = CandidateStatus.bench

    repo.update()
    return {"status": "updated", "match_id": match_id, "new_status": payload.status}


@router.post("/jobs/generate-jd", summary="Synthesize a professional JD from keywords")
def generate_jd(
    payload: GenerateJDRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    from talentstream_core_service.services.ai_services.openai_service import openai_service
    jd_content = openai_service.generate_jd_from_keywords(
        keywords=payload.keywords,
        role_title=payload.title or "Open Role"
    )
    return {"status": "success", "jd": jd_content}


@router.get("/jobs/{job_id}/results", summary="Poll incremental match results for a job")
def get_job_results(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Polling endpoint for the PM dashboard.
    Returns matches ranked by score as they accumulate from Worker 2.
    total_expected = job.top_k (set by PM when creating the JD — e.g. 2, 4, 10)
    total_processed = how many match records exist so far
    is_complete = True once total_processed >= total_expected
    Frontend polls every 3s until is_complete is True.
    """
    repo = JobRepository(db)
    job = repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    TIMEOUT_MINUTES = 15
    from datetime import datetime, timezone, timedelta

    matching_status = getattr(job, "matching_status", "idle")
    matching_started_at = getattr(job, "matching_started_at", None)
    batches_total = getattr(job, "batches_total", 0) or 0
    batches_completed = getattr(job, "batches_completed", 0) or 0

    # Timeout detection — auto-reset stuck jobs
    if matching_status == "running" and matching_started_at:
        elapsed = datetime.now(timezone.utc) - matching_started_at.replace(tzinfo=timezone.utc)
        if elapsed > timedelta(minutes=TIMEOUT_MINUTES):
            matching_status = "failed"
            db.execute(
                __import__("sqlalchemy").text(
                    "UPDATE job_requests SET matching_status = 'failed' WHERE id = :job_id"
                ),
                {"job_id": job_id}
            )
            db.commit()

    is_complete = matching_status == "completed"

    # Build results — only evaluated matches, ranked by score
    matches = repo.get_matches_by_job_id(job_id)
    candidate_ids = [m.candidate_id for m in matches]
    candidates_map = {}
    if candidate_ids:
        candidates_list = repo.get_candidates_by_ids([str(i) for i in candidate_ids])
        candidates_map = {str(c.id): c for c in candidates_list}

    results = []
    for m in matches:
        c = candidates_map.get(str(m.candidate_id))
        results.append({
            "match_id": str(m.id),
            "candidate_id": str(m.candidate_id),
            "candidate_name": c.name if c else "Unknown",
            "match_score": float(m.match_score) if m.match_score else None,
            "ai_justification": m.ai_justification,
            "status": m.status,
            "l1_status": m.l1_status,
            "l2_status": m.l2_status,
            "hiring_decision": m.hiring_decision,
            "experience_years": float(c.experience_years) if c and getattr(c, "experience_years", None) else 0,
            "resume_url": getattr(c, "resume_url", None),
            "candidate_email": getattr(c, "email", None),
            "candidate_phone": getattr(c, "phone", None),
            "candidate_skills": getattr(c, "skills", ""),
            "candidate_employee_id": getattr(c, "employee_id", None),
            "candidate_status": getattr(c.status, "value", str(c.status)) if c and c.status else "bench",
        })

    return {
        "job_id": job_id,
        "matching_status": matching_status,
        "batches_total": batches_total,
        "batches_completed": batches_completed,
        "is_complete": is_complete,
        "results": results,
    }



@router.delete("/jobs/{job_id}", summary="Delete a job request")
def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("Program_Mgr", "Admin")),
):
    repo = JobRepository(db)
    job = repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    repo.delete(job)
    
    return {"status": "success", "message": "Job deleted successfully"}

@router.post("/pm/interviews/schedule", summary="Schedule L1/L2 Interview")
def schedule_interview(
    payload: ScheduleInterviewRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("Project_Mgr", "Program_Mgr", "Admin")),
):
    repo = JobRepository(db)
    match = repo.get_match_by_id(payload.match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    if payload.stage == "L1":
         match.l1_status = payload.status
         if payload.date: match.l1_date = payload.date
    elif payload.stage == "L2":
         match.l2_status = payload.status
         if payload.date: match.l2_date = payload.date
         
    candidate = db.query(Candidate).filter(Candidate.id == match.candidate_id).first()
    if candidate:
        if payload.status == "rejected":
            candidate.status = CandidateStatus.bench
        elif payload.status in ("scheduled", "cleared"):
            candidate.status = CandidateStatus.interview_scheduled
    
    repo.update()
    return {"status": "updated", "match_id": payload.match_id}

from typing import Optional

@router.get("/pm/interviews", summary="List scheduled interviews for PM pipeline")
def list_pm_interviews(
    job_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("Project_Mgr", "Program_Mgr", "Admin")),
):
    repo = JobRepository(db)
    pm_id = current_user.id if current_user.role == "Project_Mgr" else None
    results = repo.list_pm_interviews(pm_id=pm_id, job_id=job_id)
    
    return [
        {
            "id": str(r[0].id),
            "match_id": str(r[0].id),
            "job_title": r[1],
            "candidate_name": r[2],
            "l1_date": r[0].l1_date.isoformat() if r[0].l1_date else None,
            "l2_date": r[0].l2_date.isoformat() if r[0].l2_date else None,
            "l1_status": r[0].l1_status,
            "l2_status": r[0].l2_status,
            "hiring_decision": r[0].hiring_decision,
            "match_score": float(r[0].match_score) if r[0].match_score else None,
            "experience_years": float(r[3]) if len(r) > 3 and r[3] else 0,
        }
        for r in results
    ]

@router.patch("/pm/matches/decision", summary="Update Hiring Decision")
def update_hiring_decision(
    payload: UpdateHiringDecisionRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("Project_Mgr", "Program_Mgr", "Admin")),
):
    repo = JobRepository(db)
    match = repo.get_match_by_id(payload.match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    match.hiring_decision = payload.decision
    if payload.rejection_category: match.rejection_category = payload.rejection_category
    if payload.rejection_reason: match.rejection_reason = payload.rejection_reason
    if payload.pm_notes: match.pm_notes = payload.pm_notes
    
    candidate = db.query(Candidate).filter(Candidate.id == match.candidate_id).first()
    if candidate:
        decision_lower = payload.decision.lower()
        if decision_lower == "hired":
            candidate.status = CandidateStatus.earmarked
        elif decision_lower == "rejected":
            candidate.status = CandidateStatus.bench
            
    repo.update()
    
    # Check if job is now fulfilled or needs to be reopened
    job = repo.get_by_id(str(match.job_id))
    if job:
        job.last_activity_at = datetime.utcnow()
        fulfilled_count = repo.get_fulfilled_count_by_job_id(str(job.id))
        if fulfilled_count >= job.number_of_openings:
            if job.status != JobStatus.closed:
                job.status = JobStatus.closed
                repo.update()
        else:
            if job.status == JobStatus.closed:
                job.status = JobStatus.open
                repo.update()
                
    return {"status": "updated", "match_id": payload.match_id}
