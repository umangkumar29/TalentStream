import uuid
from sqlalchemy.orm import Session
from talentstream_core_service.db.models import Candidate, JobRequest, JobMatch, MatchStatus
from talentstream_core_service.services.ai_services.openai_service import openai_service
from talentstream_core_service.configs.config import settings


class RAGEngine:
    """
    Three-stage retrieval pipeline:
      Stage 1 – Filter candidates with valid embeddings
      Stage 2 – Cosine vector similarity via pgvector
      Stage 3 – LLM (GPT-4o) justification generation
    """

    def run(self, job_id: str, db: Session) -> list[dict]:
        # ── Fetch the job request ─────────────────────────────────────────────
        job: JobRequest | None = db.query(JobRequest).filter(JobRequest.id == job_id).first()
        if not job:
            raise ValueError(f"Job request {job_id} not found.")

        # ── Stage 1: Get all candidates with embeddings ──────────────────────
        candidate_pool = (
            db.query(Candidate)
            .filter(Candidate.embedding.isnot(None))
            .all()
        )

        if not candidate_pool:
            return []

        # ── Stage 2: Vector similarity (cosine) ───────────────────────────────
        jd_embedding = openai_service.get_embedding(job.description)

        top_candidates = (
            db.query(Candidate)
            .filter(Candidate.embedding.isnot(None))
            .order_by(Candidate.embedding.cosine_distance(jd_embedding))
            .limit(settings.RAG_TOP_K)
            .all()
        )

        # ── Stage 3: LLM reasoning + persist matches ──────────────────────────
        results = []
        for rank, candidate in enumerate(top_candidates):
            justification = openai_service.generate_match_justification(
                job_description=job.description,
                resume_text=candidate.skills or "No resume details available."
            )
            score = round(max(0.0, 100.0 - rank * 4.5), 2)

            # Upsert job_match record
            existing = (
                db.query(JobMatch)
                .filter(JobMatch.job_id == job.id, JobMatch.candidate_id == candidate.id)
                .first()
            )
            if existing:
                existing.match_score = score
                existing.ai_justification = justification
                existing.status = MatchStatus.pending
            else:
                db.add(
                    JobMatch(
                        id=uuid.uuid4(),
                        job_id=job.id,
                        candidate_id=candidate.id,
                        match_score=score,
                        ai_justification=justification,
                        status=MatchStatus.pending,
                    )
                )

            results.append({
                "candidate_id": str(candidate.id),
                "candidate_name": candidate.name,
                "match_score": score,
                "ai_justification": justification,
            })

        db.commit()
        return results


rag_engine = RAGEngine()
