import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.audit_log import AuditLog


class AuditService:
    @staticmethod
    def record_audit(
        db: Session,
        action_type: str,
        resource_type: str,
        resource_id: str,
        actor_id: Optional[str] = None,
        actor_email: Optional[str] = None,
        ip_address: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        log = AuditLog(
            id=str(uuid.uuid4()),
            actor_id=actor_id,
            actor_email=actor_email,
            ip_address=ip_address,
            action_type=action_type,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def list_logs(
        db: Session,
        limit: int = 50,
        resource_type: Optional[str] = None,
        action_type: Optional[str] = None
    ) -> List[AuditLog]:
        query = db.query(AuditLog)
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        if action_type:
            query = query.filter(AuditLog.action_type == action_type)
        return query.order_by(desc(AuditLog.timestamp)).limit(limit).all()

