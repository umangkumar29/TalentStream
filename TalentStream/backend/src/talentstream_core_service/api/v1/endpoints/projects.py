import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from talentstream_core_service.db.database import get_db
from talentstream_core_service.db.models import Project
from talentstream_core_service.auth.auth import require_roles, CurrentUser
from talentstream_core_service.repositories.project_repository import ProjectRepository
from talentstream_core_service.schemas.project import ProjectCreate, ProjectResponse

router = APIRouter()

# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/projects", response_model=ProjectResponse)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("Admin", "Program_Mgr"))
):
    repo = ProjectRepository(db)
    
    # Check if code already exists
    existing = repo.get_by_code(payload.code)
    if existing:
        raise HTTPException(status_code=400, detail="Project code already exists")
    
    project = Project(
        name=payload.name,
        code=payload.code,
        manager_id=uuid.UUID(payload.manager_id) if payload.manager_id else None
    )
    repo.create(project)
    
    # Get manager name for response
    manager_name = repo.get_manager_name(project.manager_id)
        
    return {
        "id": str(project.id),
        "name": project.name,
        "code": project.code,
        "manager_id": str(project.manager_id) if project.manager_id else None,
        "manager_name": manager_name,
        "created_at": project.created_at
    }

@router.get("/projects")
def list_projects(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("Admin", "Program_Mgr", "RMG"))
):
    repo = ProjectRepository(db)
    projects = repo.list_projects_with_managers()
    
    return [
        {
            "id": str(p.Project.id),
            "name": p.Project.name,
            "code": p.Project.code,
            "manager_id": str(p.Project.manager_id) if p.Project.manager_id else None,
            "manager_name": p.manager_name,
            "created_at": p.Project.created_at
        }
        for p in projects
    ]

@router.get("/rmg/consolidated-demand")
def get_consolidated_demand(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("Admin", "RMG"))
):
    """
    RMG consolidated view: List projects with their JDs and matching summary.
    """
    repo = ProjectRepository(db)
    return repo.get_consolidated_demand()


@router.get("/rmg/all-job-demands")
def get_all_job_demands(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("Admin", "RMG")),
):
    """
    RMG Consolidated Demand: Returns a FLAT list of ALL job requests across all PMs.
    Each job includes:
    - PM name (who created/assigned it)
    - Fulfillment ratio (hired_count / num_resources)
    - Total match count
    - Job status, department, role category, created_at
    Sorted by created_at descending (newest first).
    """
    repo = ProjectRepository(db)
    return repo.get_all_job_demands()

def list_managers(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("Admin", "Program_Mgr"))
):
    repo = ProjectRepository(db)
    managers = repo.list_managers()
    return [
        {
            "id": str(m.id),
            "name": m.name,
            "email": m.email,
            "username": m.username
        }
        for m in managers
    ]
