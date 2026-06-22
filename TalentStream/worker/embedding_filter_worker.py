"""
Worker 1 — embedding_filter_worker.py
--------------------------------------
Consumes from queue: candidate_evaluation   { job_id, pm_id }
Publishes to queue:  candidate_shortlisted  { job_id, pm_id, batch_index, total_batches, candidates[] }

Pipeline:
  1. Fetch job embedding and top_k from DB
  2. Run pgvector HNSW cosine similarity search (upgraded from 384-d to 1536-d OpenAI embeddings)
  3. Apply hard filters: status='bench', embedding is not NULL
  4. Chunk top-K results into batches of 5
  5. Publish each batch to candidate_shortlisted
  6. ACK original message only after ALL batches are published

NOTE: Embeddings are now 1536-dimensional (OpenAI text-embedding-3-small).
  Previously 384-d (sentence-transformers all-MiniLM-L6-v2) — changed for
  consistent embedding space between JDs and resumes, critical for cosine similarity.
"""

import os
import json
import time
import math
import pika
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sentence_transformers import CrossEncoder


load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
RABBITMQ_URL = os.environ.get("RABBITMQ_URL", "amqp://tsuser:tspassword@rabbitmq:5672/")
QUEUE_EVALUATION = "candidate_evaluation"
QUEUE_SHORTLISTED = "candidate_shortlisted"
BATCH_SIZE = 2

# ── Database Setup ──────────────────────────────────────────────────────────────
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# ── AI Models ───────────────────────────────────────────────────────────────────
print("[W1] Loading BGE Reranker Model into memory...")
try:
    # Using v2-m3 for state-of-the-art multilingual and long-context accuracy.
    # We constrain max_length to 2048 to balance extreme context depth with memory safety.
    reranker = CrossEncoder('BAAI/bge-reranker-v2-m3', max_length=2048)
    print("[W1] BGE Reranker ready.")
except Exception as e:
    print(f"[W1] CRITICAL ERROR: Failed to load BGE Reranker. {e}")
    raise

def safe_sigmoid(x: float) -> float:
    """Safe sigmoid function to normalize raw CrossEncoder logits into 0-1 range without math overflow."""
    try:
        if x >= 0:
            z = math.exp(-x)
            return 1 / (1 + z)
        else:
            z = math.exp(x)
            return z / (1 + z)
    except Exception:
        return 0.0



def get_top_candidates(db: Session, job_id: str, excluded_candidate_ids: list[str] | None = None) -> tuple[list[dict], int]:
    """
    Stage 1: SQL filter by availability + embedding existence
    Stage 2: pgvector HNSW cosine similarity search (1536-d OpenAI embeddings)
    Returns a list of {candidate_id, similarity_score} dicts and the top_k value.
    Optionally excludes already-evaluated candidates (used for Re-Trigger Matches).
    """
    # Fetch job metadata AND description
    job_row = db.execute(
        text("SELECT description, embedding, top_k FROM job_requests WHERE id = :job_id"),
        {"job_id": job_id}
    ).fetchone()

    if not job_row or job_row.embedding is None:
        print(f"[W1] Job {job_id} not found or has no embedding — skipping.")
        return [], 0

    jd_text = job_row.description or ""
    top_k = int(job_row.top_k) if job_row.top_k else 5
    
    # Phase 1: Widen the net to ensure we don't drop strong candidates early
    fetch_limit = max(top_k * 5, 50)

    # Build exclusion clause dynamically
    exclusion_clause = ""
    params: dict = {"embedding": job_row.embedding, "limit": fetch_limit}
    if excluded_candidate_ids:
        # Use ANY(:exclude_ids) for clean parameterized exclusion
        exclusion_clause = "AND id::text != ALL(CAST(:exclude_ids AS text[]))"
        params["exclude_ids"] = "{" + ",".join(excluded_candidate_ids) + "}"
        print(f"[W1] Re-Trigger mode: excluding {len(excluded_candidate_ids)} already-evaluated candidates.")

    # Force exact sequential scan for 100% recall at current scale (< 50k candidates).
    # HNSW is ANN (approximate) — at 700-1000 resumes, exact scan is only ~10ms slower
    # but guarantees NO candidate is ever missed by the approximation algorithm.
    # When the pool grows beyond ~50k resumes, remove this line and tune hnsw.ef_search instead.
    db.execute(text("SET LOCAL enable_indexscan = off"))

    # Exact cosine similarity search across ALL bench candidates
    # <=> = cosine distance (lower = more similar), 1 - distance = cosine similarity score
    rows = db.execute(
        text(f"""
            SELECT
                id::text AS candidate_id,
                resume_json,
                1 - (embedding <=> CAST(:embedding AS vector)) AS similarity_score
            FROM candidates
            WHERE
                embedding IS NOT NULL
                AND status = 'bench'
                {exclusion_clause}
            ORDER BY embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
        """),
        params
    ).fetchall()

    if not rows:
        return [], top_k
        
    print(f"[W1] Job {job_id}: pgvector retrieved {len(rows)} candidates (limit={fetch_limit})")

    # --- PHASE 2: BGE CROSS-ENCODER RERANKING ---
    print(f"[W1] Reranking {len(rows)} candidates using BGE Cross-Encoder...")
    pairs = []
    candidate_meta = []

    for r in rows:
        rj = r.resume_json or {}
        if "candidate" in rj:
            rj = rj["candidate"]
        
        skills = rj.get("skills", [])
        skills_str = ", ".join(skills) if isinstance(skills, list) else str(skills)
        summary = rj.get("professional_summary", "") or ""
        
        # Combine skills and summary for the reranker context
        candidate_text = f"Skills: {skills_str}\nSummary: {summary}"
        
        pairs.append([jd_text, candidate_text])
        candidate_meta.append({
            "candidate_id": str(r.candidate_id), 
            "pgvector_score": float(r.similarity_score)
        })

    # Predict scores using the CrossEncoder
    scores = reranker.predict(pairs)

    # Attach BGE scores and sort descending
    for i, score in enumerate(scores):
        candidate_meta[i]["similarity_score"] = float(score)  # Replace pgvector score
        
    candidate_meta.sort(key=lambda x: x["similarity_score"], reverse=True)

    # Take exactly top_k — BGE re-ranker narrows the pool accurately before LLM
    final_limit = top_k
    best_candidates = candidate_meta[:final_limit]

    print(f"[W1] BGE Reranking complete. Forwarding {len(best_candidates)} to LLM worker.")
    return best_candidates, top_k


def publish_batches(channel, job_id: str, pm_id: str | None, candidates: list[dict]) -> int:
    """
    Chunks candidates into groups of BATCH_SIZE and publishes each group
    to candidate_shortlisted. Returns total number of batches published.
    """
    channel.queue_declare(queue=QUEUE_SHORTLISTED, durable=True)

    total_batches = math.ceil(len(candidates) / BATCH_SIZE)
    for i in range(total_batches):
        batch = candidates[i * BATCH_SIZE: (i + 1) * BATCH_SIZE]
        message = json.dumps({
            "job_id": job_id,
            "pm_id": pm_id,
            "batch_index": i,
            "total_batches": total_batches,
            "candidates": batch,  # [{candidate_id, similarity_score}]
        })
        channel.basic_publish(
            exchange="",
            routing_key=QUEUE_SHORTLISTED,
            body=message,
            properties=pika.BasicProperties(delivery_mode=pika.DeliveryMode.Persistent),
        )
        print(f"[W1] Published batch {i + 1}/{total_batches} for job {job_id} ({len(batch)} candidates)")

    return total_batches


def process_message(ch, method, properties, body):
    payload = json.loads(body)
    job_id = payload.get("job_id")
    pm_id = payload.get("pm_id")
    excluded_candidate_ids = payload.get("excluded_candidate_ids")  # None for fresh runs

    print(f"[W1] Received trigger for job {job_id} (pm_id={pm_id}, retrigger={bool(excluded_candidate_ids)})")

    db = SessionLocal()
    try:
        candidates, top_k = get_top_candidates(db, job_id, excluded_candidate_ids)
        
        if not candidates:
            print(f"[W1] No (new) candidates found for job {job_id} — ACKing and skipping.")
            db.execute(text("UPDATE job_requests SET matching_status = 'completed', batches_total = 0, batches_completed = 0 WHERE id = :job_id"), {"job_id": job_id})
            db.commit()
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        # Set matching_status=running and record total batches BEFORE publishing
        total_batches = math.ceil(len(candidates) / BATCH_SIZE)
        db.execute(
            text("UPDATE job_requests SET matching_status = 'running', batches_total = :total, batches_completed = 0, matching_started_at = NOW() WHERE id = :job_id"),
            {"total": total_batches, "job_id": job_id}
        )
        db.commit()

        publish_batches(ch, job_id, pm_id, candidates)
        print(f"[W1] Done — published {total_batches} batch(es) for job {job_id} (Total candidates: {len(candidates)})")
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print(f"[W1] ERROR processing job {job_id}: {e}")
        # Use requeue=False to prevent infinite loop on persistent errors
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    finally:
        db.close()


def main():
    print("[W1] embedding_filter_worker starting...")
    parameters = pika.URLParameters(RABBITMQ_URL)

    for attempt in range(15):
        try:
            connection = pika.BlockingConnection(parameters)
            break
        except Exception as e:
            print(f"[W1] RabbitMQ not ready, retry {attempt + 1}/15 ({e})", flush=True)
            time.sleep(5)
    else:
        print("[W1] Could not connect to RabbitMQ. Exiting.", flush=True)
        return

    channel = connection.channel()
    channel.queue_declare(queue=QUEUE_EVALUATION, durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=QUEUE_EVALUATION, on_message_callback=process_message)

    print(f"[W1] Ready — consuming from '{QUEUE_EVALUATION}'. CTRL+C to stop.")
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        channel.stop_consuming()
    finally:
        connection.close()


if __name__ == "__main__":
    main()
