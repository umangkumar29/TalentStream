import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
from ..repositories.job_repository import job_repo
from ..repositories.candidate_repository import candidate_repo
from ..db.models.models import JobStatus, MatchStatus
from ..services.ranking.rag_engine import rag_engine

class RecruitmentService:
    @staticmethod
    def create_job(db: Session, payload: Dict[str, Any], current_user: Any) -> Dict[str, Any]:
        # Resolve IDs safely
        user_id = None
        try:
            if current_user.id:
                user_id = uuid.UUID(current_user.id)
        except (ValueError, TypeError):
            # Fallback if the frontend is using strings like "Project_Mgr" for demo IDs
            pass
        
        job_data = {
            "id": uuid.uuid4(),
            "title": payload["title"],
            "description": payload["description"],
            "top_k": payload.get("top_k", 5),
            "status": JobStatus.open,
            "creator_id": user_id,
            "project_manager_id": user_id if current_user.role == "Project_Mgr" else None
        }
        
        # If created by a PM, it's immediately assigned to them
        if job_data["project_manager_id"]:
            job_data["status"] = JobStatus.assigned
            
        job = job_repo.create(db, job_data)
        
        # return simplified response metadata
        return {
            "status": "created",
            "job_id": str(job.id),
            "created_by": current_user.email
        }

    @staticmethod
    def list_jobs(db: Session) -> List[Dict[str, Any]]:
        jobs = job_repo.list_all(db)
        return [
            {
                "id": str(j.id),
                "title": j.title,
                "description": j.description,
                "department": j.department,
                "status": j.status,
                "project_manager_id": str(j.project_manager_id) if j.project_manager_id else None,
                "creator_id": str(j.creator_id) if j.creator_id else None,
                "created_at": j.created_at.isoformat()
            }
            for j in jobs
        ]

    @staticmethod
    def update_hiring_decision(db: Session, payload: Dict[str, Any]) -> Dict[str, Any]:
        match = job_repo.get_match_by_id(db, uuid.UUID(payload["match_id"]))
        if not match: return {"error": "match not found"}
        
        match.hiring_decision = payload["decision"]
        if payload["decision"] == "selected":
            match.is_hired = datetime.utcnow()
            job_repo.update_status(db, match.job_id, JobStatus.closed)
        elif payload["decision"] == "rejected":
            match.rejection_category = payload.get("rejection_category")
            match.rejection_reason = payload.get("rejection_reason")
            match.status = MatchStatus.rejected
            
        db.commit()
        return {"status": payload["decision"], "match_id": str(match.id)}

recruitment_service = RecruitmentService()
