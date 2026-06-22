from sqlalchemy.orm import Session
from sqlalchemy import or_
import uuid
from typing import Optional, List, Any
from talentstream_core_service.db.models import JobRequest, JobMatch, Candidate

class JobRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, job: JobRequest) -> JobRequest:
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def get_by_id(self, job_id: str) -> Optional[JobRequest]:
        return self.db.query(JobRequest).filter(JobRequest.id == job_id).first()

    def list_all(self) -> List[JobRequest]:
        return self.db.query(JobRequest).order_by(JobRequest.created_at.desc()).all()

    def delete(self, job: JobRequest) -> None:
        self.db.delete(job)
        self.db.commit()

    def get_matches_by_job_id(self, job_id: str) -> List[JobMatch]:
        return self.db.query(JobMatch).filter(JobMatch.job_id == job_id).order_by(JobMatch.match_score.desc()).all()

    def get_match_by_id(self, match_id: str) -> Optional[JobMatch]:
        return self.db.query(JobMatch).filter(JobMatch.id == match_id).first()

    def get_match_count_by_job_id(self, job_id: str) -> int:
        return self.db.query(JobMatch).filter(JobMatch.job_id == job_id).count()

    def get_fulfilled_count_by_job_id(self, job_id: str) -> int:
        return self.db.query(JobMatch).filter(
            JobMatch.job_id == job_id,
            JobMatch.hiring_decision.ilike('hired')
        ).count()

    def get_candidates_by_ids(self, candidate_ids: List[str]) -> List[Candidate]:
        if not candidate_ids:
            return []
        return self.db.query(Candidate).filter(Candidate.id.in_(candidate_ids)).all()

    def list_pm_interviews(self, pm_id: Optional[str] = None, job_id: Optional[str] = None) -> List[Any]:
        query = self.db.query(JobMatch, JobRequest.title, Candidate.name, Candidate.experience_years)\
            .join(JobRequest, JobMatch.job_id == JobRequest.id)\
            .join(Candidate, JobMatch.candidate_id == Candidate.id)\
            .filter(
                or_(
                    JobMatch.status == 'shortlisted',
                    JobMatch.l1_date.isnot(None),
                    JobMatch.l2_date.isnot(None),
                    JobMatch.l1_status.isnot(None)
                )
            )
        
        if pm_id:
            query = query.filter(JobRequest.project_manager_id == uuid.UUID(pm_id))
            
        if job_id:
            query = query.filter(JobRequest.id == uuid.UUID(job_id))
        
        return query.order_by(JobMatch.l1_date.asc().nulls_last()).all()

    def update(self) -> None:
        self.db.commit()
