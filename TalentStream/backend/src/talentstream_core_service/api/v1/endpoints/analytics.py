from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from talentstream_core_service.db.database import get_db
from talentstream_core_service.auth.auth import get_current_user, CurrentUser
from talentstream_core_service.repositories.analytics_repository import AnalyticsRepository
from talentstream_core_service.repositories.user_repository import UserRepository

router = APIRouter()


@router.get("/pgm/project-managers", summary="List all Project Managers")
def list_pms(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    repo = UserRepository(db)
    pms = repo.get_all()
    return [
        {
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
        }
        for u in pms if u.role.value == "Project_Mgr"
    ]


@router.get("/analytics/pgm", summary="Real-time PGM dashboard analytics")
def get_pgm_analytics(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    pm_id = current_user.id if current_user.role == "Project_Mgr" else None
    repo = AnalyticsRepository(db)
    return repo.get_pgm_analytics(pm_id)


@router.get("/analytics/rmg", summary="Real-time RMG dashboard analytics")
def get_rmg_analytics(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    repo = AnalyticsRepository(db)
    return repo.get_rmg_analytics()


@router.get("/analytics/vp/insights", summary="VP: Global organization KPIs")
def get_vp_insights(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user), # Role check optional here
):
    repo = AnalyticsRepository(db)
    return repo.get_vp_insights()


@router.get("/analytics/vp/trends", summary="VP: Monthly hiring trends")
def get_vp_hiring_trends(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    repo = AnalyticsRepository(db)
    return repo.get_vp_hiring_trends()


@router.get("/analytics/vp/departments", summary="VP: Departmental health index")
def get_vp_departmental_performance(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    repo = AnalyticsRepository(db)
    return repo.get_vp_departmental_performance()
