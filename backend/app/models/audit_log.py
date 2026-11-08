import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON, Index
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), nullable=True, index=True)
    actor_email = Column(String(255), nullable=True)
    ip_address = Column(String(100), nullable=True)

    action_type = Column(String(100), nullable=False, index=True) 
    # e.g., VIEW_MEDICAL_PROFILE, UPDATE_MEDICAL_PROFILE, EXPORT_EMERGENCY_PASS, RESOLVE_EMERGENCY
    
    resource_type = Column(String(100), nullable=False, index=True) # MEDICAL_PROFILE, PATIENT, EMERGENCY_EVENT
    resource_id = Column(String(36), nullable=False, index=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    __table_args__ = (
        Index("ix_audit_action_timestamp", "action_type", "timestamp"),
    )

