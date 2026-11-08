import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship as orm_relationship
from app.core.database import Base


class EmergencyEvent(Base):
    __tablename__ = "emergency_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(String(36), ForeignKey("risk_assessments.id", ondelete="SET NULL"), nullable=True)
    reading_id = Column(String(36), ForeignKey("sensor_readings.id", ondelete="SET NULL"), nullable=True)

    severity = Column(String(50), default="CRITICAL", nullable=False) # WARNING, URGENT, CRITICAL
    state = Column(String(50), default="DETECTED", nullable=False, index=True) 
    # States: DETECTED, PENDING_VERIFICATION, VERIFIED, ESCALATED, ACKNOWLEDGED, RESOLVED, CANCELLED

    reason = Column(String(255), nullable=False)
    detected_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    verification_deadline_at = Column(DateTime(timezone=True), nullable=True)
    
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution_notes = Column(Text, nullable=True)

    # Relationships
    patient = orm_relationship("Patient")
    assessment = orm_relationship("RiskAssessment")
    reading = orm_relationship("SensorReading")
    acknowledged_by = orm_relationship("User", foreign_keys=[acknowledged_by_user_id])
    resolved_by = orm_relationship("User", foreign_keys=[resolved_by_user_id])
    timeline = orm_relationship("EmergencyTimelineLog", back_populates="emergency_event", cascade="all, delete-orphan")
    notifications = orm_relationship("Notification", back_populates="emergency_event", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_emergency_patient_state", "patient_id", "state"),
    )


class EmergencyTimelineLog(Base):
    __tablename__ = "emergency_timeline_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    emergency_event_id = Column(String(36), ForeignKey("emergency_events.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(50), nullable=False) # CREATED, GRACE_PERIOD_STARTED, AUTO_ESCALATED, ACKNOWLEDGED, RESOLVED, CANCELLED
    actor_type = Column(String(50), default="SYSTEM", nullable=False) # SYSTEM, CAREGIVER, PATIENT
    actor_id = Column(String(36), nullable=True)
    description = Column(Text, nullable=False)
    logged_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    emergency_event = orm_relationship("EmergencyEvent", back_populates="timeline")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    emergency_event_id = Column(String(36), ForeignKey("emergency_events.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(String(50), default="CRITICAL", nullable=False) # INFO, HIGH, CRITICAL
    is_read = Column(Boolean, default=False, nullable=False)
    is_acknowledged = Column(Boolean, default=False, nullable=False)
    sent_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)

    emergency_event = orm_relationship("EmergencyEvent", back_populates="notifications")
    user = orm_relationship("User")

