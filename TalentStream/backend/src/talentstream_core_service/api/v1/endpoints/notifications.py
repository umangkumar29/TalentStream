"""
notifications.py — API endpoints for the in-app notification system.

Provides:
  GET  /notifications              — Fetch notifications for a given role
  PATCH /notifications/{id}/read   — Mark a single notification as read
  PATCH /notifications/read-all    — Mark all notifications as read for a role
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from talentstream_core_service.db.database import get_db
from talentstream_core_service.db.models.notification import Notification
from talentstream_core_service.auth.auth import get_current_user, CurrentUser

router = APIRouter()


@router.get("/notifications", summary="Fetch notifications for the current user's role")
def list_notifications(
    unread_only: bool = False,
    role: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    # Use explicit role param if provided (needed for dev-mode where auth returns Admin),
    # otherwise fall back to the role from the JWT token.
    effective_role = role or current_user.role

    query = db.query(Notification).filter(
        Notification.target_role == effective_role
    )

    if unread_only:
        query = query.filter(Notification.is_read == False)

    notifications = query.order_by(desc(Notification.created_at)).limit(limit).all()

    return [
        {
            "id": str(n.id),
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "metadata_json": n.metadata_json,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifications
    ]


@router.patch("/notifications/read-all", summary="Mark all notifications as read")
def mark_all_read(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    effective_role = role or current_user.role
    updated = (
        db.query(Notification)
        .filter(
            Notification.target_role == effective_role,
            Notification.is_read == False,
        )
        .update({Notification.is_read: True})
    )
    db.commit()
    return {"status": "ok", "marked_read": updated}


@router.patch("/notifications/{notification_id}/read", summary="Mark a single notification as read")
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    notif = db.query(Notification).filter(
        Notification.id == uuid.UUID(notification_id),
    ).first()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    return {"status": "ok", "id": notification_id}
