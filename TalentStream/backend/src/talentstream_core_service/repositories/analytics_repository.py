from sqlalchemy.orm import Session, aliased
from sqlalchemy import func, case, distinct
from typing import Dict, Any, Optional, List
from datetime import datetime as dt, timedelta

from talentstream_core_service.db.models import JobRequest, JobMatch, Candidate, JobStatus, MatchStatus, CandidateStatus, User, UserRole

class AnalyticsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_pgm_analytics(self, pm_id: Optional[str] = None) -> Dict[str, Any]:
        pm_filter = JobRequest.project_manager_id == pm_id if pm_id else True
        
        # Job Stats
        total_jobs = self.db.query(func.count(JobRequest.id)).filter(pm_filter).scalar() or 0
        open_jobs = self.db.query(func.count(JobRequest.id)).filter(
            pm_filter,
            JobRequest.status.in_([JobStatus.open, JobStatus.indexing])
        ).scalar() or 0
        in_review_jobs = self.db.query(func.count(JobRequest.id)).filter(
            pm_filter,
            JobRequest.status.in_([JobStatus.assigned, JobStatus.in_progress, JobStatus.interviewing])
        ).scalar() or 0
        closed_jobs = self.db.query(func.count(JobRequest.id)).filter(pm_filter, JobRequest.status == JobStatus.closed).scalar() or 0

        # Candidate Stats
        total_candidates = self.db.query(func.count(Candidate.id)).scalar() or 0

        # Match Stats
        job_ids = [j.id for j in self.db.query(JobRequest).filter(pm_filter).all()]
        match_query = self.db.query(JobMatch).filter(JobMatch.job_id.in_(job_ids)) if job_ids else self.db.query(JobMatch).filter(False)
        
        total_matches = self.db.query(func.count(distinct(JobMatch.candidate_id))).filter(JobMatch.job_id.in_(job_ids)).scalar() or 0
        shortlisted = match_query.filter(JobMatch.hiring_decision == 'selected').count()
        rejected = match_query.filter(JobMatch.status == MatchStatus.rejected).count()
        scheduled = match_query.filter((JobMatch.l1_status == 'scheduled') | (JobMatch.l2_status == 'scheduled')).count()

        avg_score_row = match_query.with_entities(func.avg(JobMatch.match_score)).filter(JobMatch.match_score.isnot(None)).scalar()
        avg_match_score = round(float(avg_score_row), 1) if avg_score_row is not None else 0.0
        fulfillment_rate = round((closed_jobs / total_jobs) * 100, 1) if total_jobs > 0 else 0.0

        # Departmental Breakdown (using title since department is removed)
        title_rows = (
            self.db.query(
                JobRequest.title,
                func.count(JobRequest.id).label("total"),
                func.sum(case((JobRequest.status == JobStatus.closed, 1), else_=0)).label("closed"),
            )
            .filter(pm_filter)
            .group_by(JobRequest.title)
            .all()
        )

        departments = []
        for row in title_rows:
            dept_name = row.title or "General"
            total = row.total or 0
            filled = row.closed or 0
            rate = round((filled / total) * 100) if total > 0 else 0
            departments.append({"name": dept_name, "total": total, "filled": int(filled), "rate": rate})

        departments = sorted(departments, key=lambda x: x["total"], reverse=True)[:6]

        # PM Stats
        pm_stats_rows = (
            self.db.query(
                User.id, User.name, User.email, func.count(JobRequest.id).label("job_count")
            )
            .join(JobRequest, User.id == JobRequest.project_manager_id, isouter=True)
            .filter(User.role == UserRole.Project_Mgr)
            .group_by(User.id)
            .all()
        )
        pm_list = [{"id": str(r.id), "name": r.name, "email": r.email, "job_count": r.job_count or 0} for r in pm_stats_rows]

        # Recent Activity
        PM = aliased(User)
        recent_jobs = (
            self.db.query(JobRequest, PM.name.label("pm_name"))
            .join(PM, JobRequest.project_manager_id == PM.id, isouter=True)
            .order_by(JobRequest.created_at.desc())
            .limit(10)
            .all()
        )

        recent_activity = []
        for j, pm_name in recent_jobs:
            short_id = str(j.id).replace('-', '')[:4].upper()
            recent_activity.append({
                "id": f"#TS-{short_id}",
                "full_id": str(j.id),
                "title": j.title,
                "status": j.status.value,
                "pm_name": pm_name or "Unassigned",
                "pm_id": str(j.project_manager_id) if j.project_manager_id else None,
                "created_at": j.created_at.isoformat() if j.created_at else None,
            })

        # Top Roles
        roles_rows = (
            self.db.query(JobRequest.title, func.count(JobRequest.id).label("count"))
            .group_by(JobRequest.title)
            .order_by(func.count(JobRequest.id).desc())
            .limit(5)
            .all()
        )
        top_roles = [{"role": r.title or "General", "count": r.count} for r in roles_rows]

        return {
            "jobs": {"total": total_jobs, "open": open_jobs, "in_review": in_review_jobs, "closed": closed_jobs, "fulfillment_rate": fulfillment_rate},
            "candidates": {"total": total_candidates},
            "matches": {"total": total_matches, "shortlisted": shortlisted, "rejected": rejected, "pending": scheduled, "avg_score": avg_match_score},
            "departments": departments,
            "recent_activity": recent_activity,
            "project_managers": pm_list,
            "top_roles": top_roles,
        }

    def get_rmg_analytics(self) -> Dict[str, Any]:
        total_talent = self.db.query(func.count(Candidate.id)).scalar() or 0
        bench = self.db.query(func.count(Candidate.id)).filter(Candidate.status == CandidateStatus.bench).scalar() or 0
        allocated = self.db.query(func.count(Candidate.id)).filter(Candidate.status == CandidateStatus.allocated).scalar() or 0
        earmarked = self.db.query(func.count(Candidate.id)).filter(Candidate.status == CandidateStatus.earmarked).scalar() or 0
        
        bench_capacity = round((bench / total_talent) * 100, 1) if total_talent > 0 else 0.0
        
        avg_match_row = self.db.query(func.avg(JobMatch.match_score)).scalar()
        match_rate = round(float(avg_match_row), 1) if avg_match_row else 0.0
        
        all_cands = self.db.query(Candidate.skills).all()
        skill_counts = {}
        total_skills_count = 0
        for cand in all_cands:
            if cand.skills:
                skills_list = [s.strip() for s in cand.skills.split(",") if s.strip()]
                for s in skills_list:
                    s_key = s.title()
                    skill_counts[s_key] = skill_counts.get(s_key, 0) + 1
                    total_skills_count += 1
                    
        top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:4]
        skill_distribution = [{"name": sn, "percentage": round((c / total_skills_count) * 100)} for sn, c in top_skills] if total_skills_count > 0 and top_skills else [
            {"name": "Python Developer", "percentage": 0},
            {"name": "FastAPI Architect", "percentage": 0},
            {"name": "Frontend React", "percentage": 0},
            {"name": "Postgres DBA", "percentage": 0},
        ]

        allocated_cands = self.db.query(Candidate.created_at, Candidate.updated_at).filter(Candidate.status == CandidateStatus.allocated).all()
        if allocated_cands:
            total_days = 0
            count = 0
            for created, updated in allocated_cands:
                if created and updated:
                    diff = updated - created
                    total_days += max(diff.days, 1)
                    count += 1
            time_to_allocate = max(round(total_days / count), 1) if count > 0 else 14
        else:
            time_to_allocate = 14

        return {
            "total_talent": total_talent,
            "bench": bench,
            "allocated": allocated,
            "earmarked": earmarked,
            "bench_capacity": bench_capacity,
            "match_rate": match_rate,
            "time_to_allocate": time_to_allocate,
            "skill_distribution": skill_distribution,
        }

    def get_vp_insights(self) -> Dict[str, Any]:
        total_jds = self.db.query(func.count(JobRequest.id)).scalar() or 0
        open_jds = self.db.query(func.count(JobRequest.id)).filter(JobRequest.status == JobStatus.open).scalar() or 0
        closed_jds = self.db.query(func.count(JobRequest.id)).filter(JobRequest.status == JobStatus.closed).scalar() or 0
        
        success_rate = round((closed_jds / total_jds) * 100, 1) if total_jds > 0 else 0.0
        
        hired_matches = self.db.query(JobRequest.created_at, JobMatch.is_hired).join(JobMatch, JobRequest.id == JobMatch.job_id).filter(JobMatch.is_hired.isnot(None)).all()
        if hired_matches:
            total_days = 0
            count = 0
            for created, hired in hired_matches:
                if created and hired:
                    diff = hired - created
                    total_days += max(diff.days, 1)
                    count += 1
            avg_time_to_hire = max(round(total_days / count, 1), 1.0) if count > 0 else 18.5
        else:
            avg_time_to_hire = 18.5
        
        return {
            "totalJDs": total_jds,
            "openJDs": open_jds,
            "closedJDs": closed_jds,
            "hiringSuccessRate": success_rate,
            "avgTimeToHire": avg_time_to_hire
        }

    def get_vp_hiring_trends(self) -> List[Dict[str, Any]]:
        six_months_ago = dt.utcnow() - timedelta(days=180)
        jobs = self.db.query(JobRequest.created_at, JobRequest.status).filter(JobRequest.created_at >= six_months_ago).all()
            
        months_order = []
        trends_map = {}
        
        now = dt.utcnow()
        for i in range(5, -1, -1):
            m_date = now - timedelta(days=i*30)
            m_name = m_date.strftime("%b").upper()
            months_order.append(m_name)
            trends_map[m_name] = {"open": 0, "closed": 0}
            
        for created_at, status in jobs:
            if created_at:
                m_name = created_at.strftime("%b").upper()
                if m_name in trends_map:
                    if status == JobStatus.closed:
                        trends_map[m_name]["closed"] += 1
                    else:
                        trends_map[m_name]["open"] += 1
                        
        return [{"month": m, "open": trends_map[m]["open"], "closed": trends_map[m]["closed"]} for m in months_order]

    def get_vp_departmental_performance(self) -> List[Dict[str, Any]]:
        dept_stats = (
            self.db.query(
                JobRequest.title,
                func.count(JobRequest.id).label("total"),
                func.sum(case((JobRequest.status == JobStatus.closed, 1), else_=0)).label("filled"),
            )
            .group_by(JobRequest.title)
            .all()
        )

        results = []
        for row in dept_stats:
            dept_name = row.title or "General"
            total = row.total or 0
            filled = int(row.filled or 0)
            pending = total - filled
            
            health = int((filled / total) * 100) if total > 0 else 100
            status = "Stable"
            if health < 50: status = "Critical"
            elif health < 75: status = "Warning"
            elif health < 90: status = "On Track"

            results.append({
                "department": dept_name,
                "totalJDs": total,
                "filled": filled,
                "pending": pending,
                "healthIndex": health,
                "status": status
            })
        
        return sorted(results, key=lambda x: x["totalJDs"], reverse=True)
