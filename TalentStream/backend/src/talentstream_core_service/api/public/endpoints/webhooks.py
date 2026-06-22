from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from talentstream_core_service.db.database import get_db
from talentstream_core_service.services.ranking.rag_engine import rag_engine
from talentstream_core_service.configs.config import settings

router = APIRouter()


def _verify_hasura_secret(x_hasura_event_secret: str = Header(None)):
    """Simple shared-secret verification for Hasura Event Trigger calls."""
    if x_hasura_event_secret != settings.FASTAPI_INTERNAL_SECRET:
        raise HTTPException(status_code=403, detail="Invalid event secret.")


@router.post(
    "/process-match",
    summary="Hasura Event Trigger: on_job_request_created",
    dependencies=[Depends(_verify_hasura_secret)],
)
def process_match_webhook(payload: dict, db: Session = Depends(get_db)):
    """
    Receives a Hasura Event Trigger payload whenever a new row is
    inserted into `job_requests` and runs the full RAG pipeline.

    Expected payload shape (Hasura standard):
    {
      "event": {
        "data": {
          "new": { "id": "...", ... }
        }
      }
    }
    """
    try:
        new_row = payload.get("event", {}).get("data", {}).get("new", {})
        job_id = new_row.get("id")

        if not job_id:
            raise HTTPException(status_code=400, detail="Missing job_id in payload.")

        results = rag_engine.run(job_id=job_id, db=db)

        return {
            "status": "success",
            "job_id": job_id,
            "matches_generated": len(results),
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG pipeline failure: {str(e)}")
