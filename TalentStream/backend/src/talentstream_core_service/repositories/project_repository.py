from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
import uuid
from talentstream_core_service.db.models import Project, JobRequest, User, UserRole, JobMatch

class ProjectRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_code(self, code: str) -> Optional[Project]:
        return self.db.query(Project).filter(Project.code == code).first()

    def create(self, project: Project) -> Project:
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def get_manager_name(self, manager_id: Optional[uuid.UUID]) -> Optional[str]:
        if not manager_id:
            return None
        mgr = self.db.query(User).filter(User.id == manager_id).first()
        return mgr.name if mgr else None

    def list_projects_with_managers(self) -> List[Any]:
        return self.db.query(Project, User.name.label("manager_name"))\
            .outerjoin(User, Project.manager_id == User.id)\
            .all()

    def get_consolidated_demand(self) -> List[Dict[str, Any]]:
        projects_data = self.list_projects_with_managers()
        results = []
        for p_data in projects_data:
            p = p_data.Project
            manager_name = p_data.manager_name
            
            jds = self.db.query(JobRequest).filter(JobRequest.project_id == p.id).all()
            
            jd_list = []
            for jd in jds:
                match_count = self.db.query(func.count(JobMatch.id))\
                    .filter(JobMatch.job_id == jd.id)\
                    .scalar()
                
                jd_list.append({
                    "id": str(jd.id),
                    "title": jd.title,
                    "status": jd.status,
                    "match_count": match_count,
                    "min_experience_years": jd.min_experience_years,
                    "created_at": jd.created_at
                })
                
            results.append({
                "project_id": str(p.id),
                "project_name": p.name,
                "project_code": p.code,
                "manager_id": str(p.manager_id) if p.manager_id else None,
                "manager_name": manager_name,
                "jds": jd_list
            })
            
        return results

    def get_all_job_demands(self) -> List[Dict[str, Any]]:
        jobs = self.db.query(JobRequest).order_by(JobRequest.created_at.desc()).all()
        results = []
        for job in jobs:
            pm_name = None
            pm_email = None
            pm_id = str(job.project_manager_id) if job.project_manager_id else None

            if job.project_manager_id:
                pm = self.db.query(User).filter(User.id == job.project_manager_id).first()
                if pm:
                    pm_name = pm.name
                    pm_email = pm.email

            match_count = self.db.query(func.count(JobMatch.id))\
                .filter(JobMatch.job_id == job.id)\
                .scalar() or 0

            hired_count = self.db.query(func.count(JobMatch.id))\
                .filter(
                    JobMatch.job_id == job.id,
                    func.lower(JobMatch.hiring_decision) == "hired"
                ).scalar() or 0

            project_name = None
            project_code = None
            if job.project_id:
                proj = self.db.query(Project).filter(Project.id == job.project_id).first()
                if proj:
                    project_name = proj.name
                    project_code = proj.code

            num_resources = getattr(job, "number_of_openings", None) or 1
            top_k = int(job.top_k) if getattr(job, "top_k", None) else 5
            matching_status = getattr(job, "matching_status", None)

            results.append({
                "id": str(job.id),
                "title": job.title,
                "min_experience_years": job.min_experience_years,
                "status": job.status,
                "pm_id": pm_id,
                "pm_name": pm_name or "Unassigned",
                "pm_email": pm_email,
                "match_count": match_count,
                "hired_count": hired_count,
                "num_resources": num_resources,
                "top_k": top_k,
                "matching_status": matching_status,
                "created_at": job.created_at.isoformat() if job.created_at else None,
                "project_name": project_name,
                "project_code": project_code,
            })

        return results

    def list_managers(self) -> List[User]:
        return self.db.query(User).filter(User.role == UserRole.Project_Mgr).all()
