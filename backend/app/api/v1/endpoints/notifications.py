from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.emergency import NotificationResponse
from app.services.notification_service import NotificationService

router = APIRouter()

@router.get("", response_model=List[NotificationResponse], summary="List in-app alerts and notifications")
def list_notifications(
    unread_only: bool = False,
    limit: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
) -> List[NotificationResponse]:
    """Retrieves chronological in-app alerts dispatched to the caregiver network."""
    user_id = current_user.id if current_user else None
    notifs = NotificationService.list_notifications(db, user_id=user_id, limit=limit, unread_only=unread_only)
    return [NotificationResponse.model_validate(n) for n in notifs]

@router.patch("/{notification_id}/read", response_model=NotificationResponse, summary="Mark notification as read")
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db)
) -> NotificationResponse:
    """Updates notification status to read."""
    notif = NotificationService.mark_as_read(db, notification_id)
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return NotificationResponse.model_validate(notif)

@router.post("/acknowledge-all", summary="Acknowledge and mark all notifications as read")
def acknowledge_all(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Marks all unread alerts as acknowledged."""
    user_id = current_user.id if current_user else None
    count = NotificationService.acknowledge_all(db, user_id=user_id)
    return {"status": "success", "count": count, "message": f"Acknowledged {count} notifications"}

