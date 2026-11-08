import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.emergency import Notification


class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        title: str,
        message: str,
        priority: str = "CRITICAL",
        user_id: Optional[str] = None,
        emergency_event_id: Optional[str] = None
    ) -> Notification:
        notif = Notification(
            id=str(uuid.uuid4()),
            user_id=user_id,
            emergency_event_id=emergency_event_id,
            title=title,
            message=message,
            priority=priority,
            is_read=False,
            is_acknowledged=False,
            sent_at=datetime.now(timezone.utc)
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def list_notifications(
        db: Session,
        user_id: Optional[str] = None,
        limit: int = 50,
        unread_only: bool = False
    ) -> List[Notification]:
        query = db.query(Notification)
        if user_id:
            query = query.filter((Notification.user_id == user_id) | (Notification.user_id.is_(None)))
        if unread_only:
            query = query.filter(Notification.is_read.is_(False))
        return query.order_by(desc(Notification.sent_at)).limit(limit).all()

    @staticmethod
    def mark_as_read(db: Session, notification_id: str) -> Optional[Notification]:
        notif = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notif:
            return None
        notif.is_read = True
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def acknowledge_all(db: Session, user_id: Optional[str] = None) -> int:
        now = datetime.now(timezone.utc)
        query = db.query(Notification).filter(Notification.is_read.is_(False))
        if user_id:
            query = query.filter((Notification.user_id == user_id) | (Notification.user_id.is_(None)))
        count = query.update({"is_read": True, "is_acknowledged": True, "acknowledged_at": now})
        db.commit()
        return count

