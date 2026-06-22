"""
Worker 2 — llm_evaluation_worker.py
-------------------------------------
Consumes from queue: candidate_shortlisted  { job_id, pm_id, batch_index, total_batches, candidates[] }
Writes to DB:        job_matches             (upsert — safe to retry)

Pipeline:
  1. Fetch JD text from DB (1 query by job_id)
  2. Fetch all 5 resume texts from DB (1 query by candidate_id IN [...])
  3. Build a single structured prompt — evaluate ALL 5 candidates in ONE LLM call
  4. Parse structured JSON response array
  5. Upsert each result into job_matches (ON CONFLICT DO UPDATE)
  6. ACK only after all DB writes succeed
  7. On failure: NACK (requeue=False after 3 attempts) → dead letter queue

NOTE: Embeddings are now 1536-dimensional (OpenAI text-embedding-3-small).
  Previously 384-d (sentence-transformers) — both JDs and resumes now use the
  same embedding space which is critical for meaningful cosine similarity matching.
"""

import os
import json
import time
import uuid
import pika
from dotenv import load_dotenv
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
RABBITMQ_URL = os.environ.get("RABBITMQ_URL", "amqp://tsuser:tspassword@rabbitmq:5672/")
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL", "")
OPENAI_CHAT_MODEL = os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o-mini")
QUEUE_SHORTLISTED = "candidate_shortlisted"

# ── Database ────────────────────────────────────────────────────────────────────
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# ── OpenAI Client ───────────────────────────────────────────────────────────────
_client = OpenAI(
    api_key=OPENAI_API_KEY,
    base_url=OPENAI_BASE_URL if OPENAI_BASE_URL else None,
)


# ── LLM Evaluation ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert technical recruiter. Your task is to evaluate candidates 
against a job description and return structured evaluation results.

You will receive a JD and a list of candidates with their resume text and similarity scores.
Return ONLY a valid JSON array (no markdown, no explanation) where each element has:
{
  "candidate_id": "uuid string",
  "match_score": integer 0-100,
  "verdict": "Strong Match" | "Partial Match" | "No Match",
  "skill_alignment": {
    "matched": ["skill1", "skill2"],
    "missing": ["skill3", "skill4"]
  },
  "experience_relevance": "1-2 sentence assessment of experience fit",
  "findings": ["factual bullet 1 from resume", "factual bullet 2", "factual bullet 3"],
  "overall_summary": "2-3 sentence hiring recommendation"
}
Be specific and factual. Base findings on actual resume content."""


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def evaluate_batch_with_llm(jd_text: str, candidates_data: list[dict]) -> list[dict]:
    """
    Sends ONE LLM API call to evaluate a batch of candidates against the JD.
    Returns a list of structured evaluation dicts.
    candidates_data: [{candidate_id, name, resume_json, similarity_score}]
    resume_json is a structured dict with keys: name, email, skills, total_experience_years,
    professional_summary, work_experience etc. — parsed by the resume upload service.
    """
    candidates_section = ""
    for idx, c in enumerate(candidates_data):
        rj = c.get("resume_json") or {}
        # Pull structured fields — far richer signal than raw text
        skills = rj.get("skills", []) or []
        skills_str = ", ".join(skills) if isinstance(skills, list) else str(skills)
        experience_years = rj.get("total_experience_years", "Unknown")
        summary = rj.get("professional_summary", "") or ""
        work_exp = rj.get("work_experience", []) or []
        work_lines = ""
        for w in work_exp[:4]:  # limit to last 4 roles
            title = w.get("title", "") if isinstance(w, dict) else ""
            company = w.get("company", "") if isinstance(w, dict) else ""
            duration = w.get("duration", "") if isinstance(w, dict) else ""
            work_lines += f"  - {title} at {company} ({duration})\n"

        candidates_section += (
            f"\n--- Candidate {idx + 1} ---\n"
            f"ID: {c['candidate_id']}\n"
            f"Name: {c['name']}\n"
            f"Vector Similarity: {c['similarity_score']}\n"
            f"Total Experience: {experience_years} years\n"
            f"Skills: {skills_str}\n"
            f"Summary: {summary[:500]}\n"
            f"Work History:\n{work_lines}"
        )

    user_prompt = (
        f"### Job Description\n{jd_text[:3000]}\n\n"
        f"### Candidates to Evaluate\n{candidates_section}\n\n"
        "Return the JSON array now:"
    )

    response = _client.chat.completions.create(
        model=OPENAI_CHAT_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.1,
        max_tokens=2000,
    )

    raw = response.choices[0].message.content.strip()
    # Strip markdown code fences if the LLM wraps it anyway
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


def upsert_match(db: Session, job_id: str, candidate_id: str, evaluation: dict) -> None:
    """
    Upserts a single match result into job_matches.
    ON CONFLICT DO UPDATE makes this safe to retry without creating duplicates.
    """
    db.execute(
        text("""
            INSERT INTO job_matches (id, job_id, candidate_id, match_score, ai_justification, status, created_at)
            VALUES (:id, :job_id, :candidate_id, :match_score, :ai_justification, 'pending', NOW())
            ON CONFLICT (job_id, candidate_id)
            DO UPDATE SET
                match_score      = EXCLUDED.match_score,
                ai_justification = EXCLUDED.ai_justification,
                status           = 'pending'
        """),
        {
            "id": str(uuid.uuid4()),
            "job_id": job_id,
            "candidate_id": candidate_id,
            "match_score": evaluation.get("match_score"),
            "ai_justification": json.dumps({
                "verdict": evaluation.get("verdict"),
                "skill_alignment": evaluation.get("skill_alignment", {}),
                "experience_relevance": evaluation.get("experience_relevance", ""),
                "findings": evaluation.get("findings", []),
                "overall_summary": evaluation.get("overall_summary", ""),
            }),
        }
    )


def process_message(ch, method, properties, body):
    payload = json.loads(body)
    job_id = payload["job_id"]
    batch_index = payload.get("batch_index", 0)
    total_batches = payload.get("total_batches", 1)
    candidate_refs = payload.get("candidates", [])  # [{candidate_id, similarity_score}]

    print(f"[W2] Batch {batch_index + 1}/{total_batches} for job {job_id} ({len(candidate_refs)} candidates)")

    db = SessionLocal()
    try:
        # ── 1. Fetch JD text (1 query) ────────────────────────────────────────
        job_row = db.execute(
            text("SELECT description FROM job_requests WHERE id = :job_id"),
            {"job_id": job_id}
        ).fetchone()

        if not job_row:
            print(f"[W2] Job {job_id} not found — skipping batch.")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        jd_text = job_row.description

        # ── 2. Fetch all resume texts (1 query) ──────────────────────────────
        candidate_ids = [c["candidate_id"] for c in candidate_refs]
        similarity_map = {c["candidate_id"]: c["similarity_score"] for c in candidate_refs}

        placeholders = ", ".join([f"'{cid}'" for cid in candidate_ids])
        candidate_rows = db.execute(
            text(f"""
                SELECT id::text AS id, name, resume_json
                FROM candidates
                WHERE id::text IN ({placeholders})
            """)
        ).fetchall()

        candidates_data = [
            {
                "candidate_id": str(r.id),
                "name": r.name,
                # resume_json is already parsed JSONB from PostgreSQL — use directly
                "resume_json": (r.resume_json or {}).get("candidate", r.resume_json or {}),
                "similarity_score": similarity_map.get(str(r.id), 0.0),
            }
            for r in candidate_rows
        ]

        # ── 3. LLM evaluation (1 API call for the whole batch) ────────────────
        print(f"[W2] Calling LLM for batch {batch_index + 1}...")
        evaluations = evaluate_batch_with_llm(jd_text, candidates_data)

        # ── 4. Upsert all results (filtering out < 50% score) ─────────────────────────────────────────────
        upserted_count = 0
        for evaluation in evaluations:
            cid = evaluation.get("candidate_id")
            score = float(evaluation.get("match_score", 0))
            if not cid or score < 50:
                print(f"[W2] Discarding candidate {cid} due to low score: {score}%")
                continue
            upsert_match(db, job_id, cid, evaluation)
            upserted_count += 1

        db.commit()
        print(f"[W2] Upserted {upserted_count} results for job {job_id} batch {batch_index + 1}")

        # ── 5. Update batch progress and check completion ─────────────────────
        # Atomically increment batches_completed, then flip to 'completed' if all done
        db.execute(
            text("""
                UPDATE job_requests
                SET batches_completed = batches_completed + 1
                WHERE id = :job_id
            """),
            {"job_id": job_id}
        )
        db.execute(
            text("""
                UPDATE job_requests
                SET matching_status = 'completed'
                WHERE id = :job_id AND batches_completed >= batches_total
            """),
            {"job_id": job_id}
        )
        db.commit()

        # ── 6. ACK only after successful DB write ─────────────────────────────
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        error_msg = str(e)
        if hasattr(e, 'last_attempt') and e.last_attempt:
            error_msg = str(e.last_attempt.exception())
        print(f"[W2] ERROR in batch {batch_index} for job {job_id}: {error_msg}")
        db.rollback()
        
        # ── FAILSAFE: Prevent Infinite Polling ────────────────────────────────
        # Even if the LLM completely fails for this batch, we must increment 
        # batches_completed so the overall job can eventually reach 'completed' status.
        try:
            db.execute(
                text("UPDATE job_requests SET batches_completed = batches_completed + 1 WHERE id = :job_id"),
                {"job_id": job_id}
            )
            db.execute(
                text("UPDATE job_requests SET matching_status = 'completed' WHERE id = :job_id AND batches_completed >= batches_total"),
                {"job_id": job_id}
            )
            db.commit()
            print(f"[W2] Failsafe executed: Force-incremented batch progress for job {job_id}.")
        except Exception as failsafe_err:
            print(f"[W2] CRITICAL: Failsafe DB update failed: {failsafe_err}")
            
        # NACK and requeue=False — let RabbitMQ drop it or route to DLQ
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    finally:
        db.close()


def main():
    print("[W2] llm_evaluation_worker starting...")
    parameters = pika.URLParameters(RABBITMQ_URL)

    for attempt in range(15):
        try:
            connection = pika.BlockingConnection(parameters)
            break
        except Exception as e:
            print(f"[W2] RabbitMQ not ready, retry {attempt + 1}/15 ({e})", flush=True)
            time.sleep(5)
    else:
        print("[W2] Could not connect to RabbitMQ. Exiting.", flush=True)
        return

    channel = connection.channel()
    channel.queue_declare(queue=QUEUE_SHORTLISTED, durable=True)
    channel.basic_qos(prefetch_count=1)  # Fair dispatch — each worker holds 1 message
    channel.basic_consume(queue=QUEUE_SHORTLISTED, on_message_callback=process_message)

    print(f"[W2] Ready — consuming from '{QUEUE_SHORTLISTED}'. CTRL+C to stop.")
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        channel.stop_consuming()
    finally:
        connection.close()


if __name__ == "__main__":
    main()
