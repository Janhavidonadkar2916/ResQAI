import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.emergency import EmergencyEvent, EmergencyTimelineLog
from app.models.patient import Patient
from app.schemas.emergency import EmergencyEventResponse, EmergencyCreateRequest
from app.schemas.intelligence import RiskAssessmentResponse
from app.schemas.sensor import SensorPacket
from app.services.notification_service import NotificationService


class EmergencyService:
    @staticmethod
    def create_emergency_event(
        db: Session,
        patient_id: str,
        reason: str,
        severity: str = "CRITICAL",
        assessment_id: Optional[str] = None,
        reading_id: Optional[str] = None,
        grace_period_seconds: int = 45,
        actor_type: str = "SYSTEM",
        actor_id: Optional[str] = None
    ) -> EmergencyEvent:
        now = datetime.now(timezone.utc)
        deadline = now + timedelta(seconds=grace_period_seconds)

        event = EmergencyEvent(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            assessment_id=assessment_id,
            reading_id=reading_id,
            severity=severity,
            state="PENDING_VERIFICATION",
            reason=reason,
            detected_at=now,
            verification_deadline_at=deadline
        )
        db.add(event)
        db.flush()

        # Log creation to timeline
        log = EmergencyTimelineLog(
            id=str(uuid.uuid4()),
            emergency_event_id=event.id,
            action="CREATED",
            actor_type=actor_type,
            actor_id=actor_id,
            description=f"Incident initiated: {reason}. Verification grace period started ({grace_period_seconds}s).",
            logged_at=now
        )
        db.add(log)

        # Dispatch Caregiver Notification
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        p_name = f"{patient.first_name} {patient.last_name}" if patient else "Patient"
        NotificationService.create_notification(
            db=db,
            title=f"URGENT HEALTH INCIDENT: {p_name}",
            message=f"{reason}. Grace period verification active ({grace_period_seconds}s).",
            priority="CRITICAL",
            emergency_event_id=event.id
        )

        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def check_grace_period_expirations(db: Session) -> List[EmergencyEvent]:
        """
        Enforces critical safety rule:
        If patient verification grace period expires without user cancellation,
        automatically transition to VERIFIED and escalate to caregivers.
        """
        now = datetime.now(timezone.utc)
        all_pending = (
            db.query(EmergencyEvent)
            .filter(EmergencyEvent.state == "PENDING_VERIFICATION")
            .all()
        )

        expired_events = []
        for event in all_pending:
            if event.verification_deadline_at:
                deadline = event.verification_deadline_at
                if deadline.tzinfo is None:
                    deadline = deadline.replace(tzinfo=timezone.utc)
                if deadline <= now:
                    expired_events.append(event)

        for event in expired_events:
            event.state = "VERIFIED"
            log = EmergencyTimelineLog(
                id=str(uuid.uuid4()),
                emergency_event_id=event.id,
                action="GRACE_PERIOD_EXPIRED",
                actor_type="SYSTEM",
                description="Patient verification grace period expired without cancellation. Auto-verified and escalated.",
                logged_at=now
            )
            db.add(log)
            # Create escalation notification
            NotificationService.create_notification(
                db=db,
                title="VERIFIED EMERGENCY ESCALATION",
                message=f"Incident for patient verified following unacknowledged grace period: {event.reason}",
                priority="CRITICAL",
                emergency_event_id=event.id
            )

        if expired_events:
            db.commit()
            for e in expired_events:
                db.refresh(e)

        return expired_events

    @staticmethod
    def acknowledge_event(db: Session, event_id: str, user_id: Optional[str] = None) -> Optional[EmergencyEvent]:
        event = db.query(EmergencyEvent).filter(EmergencyEvent.id == event_id).first()
        if not event:
            return None

        now = datetime.now(timezone.utc)
        event.state = "ACKNOWLEDGED"
        event.acknowledged_at = now
        event.acknowledged_by_user_id = user_id

        log = EmergencyTimelineLog(
            id=str(uuid.uuid4()),
            emergency_event_id=event.id,
            action="ACKNOWLEDGED",
            actor_type="CAREGIVER" if user_id else "SYSTEM",
            actor_id=user_id,
            description="Caregiver acknowledged incident. Escalation timers halted.",
            logged_at=now
        )
        db.add(log)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def escalate_event(db: Session, event_id: str, user_id: Optional[str] = None, note: Optional[str] = None) -> Optional[EmergencyEvent]:
        event = db.query(EmergencyEvent).filter(EmergencyEvent.id == event_id).first()
        if not event:
            return None

        now = datetime.now(timezone.utc)
        event.state = "ESCALATED"

        log = EmergencyTimelineLog(
            id=str(uuid.uuid4()),
            emergency_event_id=event.id,
            action="ESCALATED",
            actor_type="CAREGIVER" if user_id else "SYSTEM",
            actor_id=user_id,
            description=f"Incident escalated to secondary emergency contacts: {note or 'Urgent escalation invoked.'}",
            logged_at=now
        )
        db.add(log)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def resolve_event(db: Session, event_id: str, user_id: Optional[str], resolution_notes: str) -> Optional[EmergencyEvent]:
        event = db.query(EmergencyEvent).filter(EmergencyEvent.id == event_id).first()
        if not event:
            return None

        now = datetime.now(timezone.utc)
        event.state = "RESOLVED"
        event.resolved_at = now
        event.resolved_by_user_id = user_id
        event.resolution_notes = resolution_notes

        log = EmergencyTimelineLog(
            id=str(uuid.uuid4()),
            emergency_event_id=event.id,
            action="RESOLVED",
            actor_type="CAREGIVER" if user_id else "CLINICIAN",
            actor_id=user_id,
            description=f"Incident resolved. Resolution documentation: {resolution_notes}",
            logged_at=now
        )
        db.add(log)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def cancel_event(db: Session, event_id: str, user_id: Optional[str], cancellation_reason: str) -> Optional[EmergencyEvent]:
        event = db.query(EmergencyEvent).filter(EmergencyEvent.id == event_id).first()
        if not event:
            return None

        now = datetime.now(timezone.utc)
        event.state = "CANCELLED"
        event.resolution_notes = f"CANCELLED: {cancellation_reason}"

        log = EmergencyTimelineLog(
            id=str(uuid.uuid4()),
            emergency_event_id=event.id,
            action="CANCELLED",
            actor_type="USER" if user_id else "PATIENT",
            actor_id=user_id,
            description=f"Incident cancelled as false alarm: {cancellation_reason}",
            logged_at=now
        )
        db.add(log)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def list_events(db: Session, patient_id: Optional[str] = None, active_only: bool = False, limit: int = 50) -> List[EmergencyEvent]:
        # Process any pending expirations first
        EmergencyService.check_grace_period_expirations(db)

        query = db.query(EmergencyEvent)
        if patient_id:
            query = query.filter(EmergencyEvent.patient_id == patient_id)
        if active_only:
            query = query.filter(EmergencyEvent.state.in_(["DETECTED", "PENDING_VERIFICATION", "VERIFIED", "ESCALATED", "ACKNOWLEDGED"]))
        
        return query.order_by(desc(EmergencyEvent.detected_at)).limit(limit).all()

    @staticmethod
    def get_event(db: Session, event_id: str) -> Optional[EmergencyEvent]:
        EmergencyService.check_grace_period_expirations(db)
        return db.query(EmergencyEvent).filter(EmergencyEvent.id == event_id).first()

    @staticmethod
    def auto_trigger_from_ai(
        db: Session, 
        packet: SensorPacket, 
        assessment: RiskAssessmentResponse
    ) -> Optional[EmergencyEvent]:
        """
        Hook called after AI assessment.
        If a critical risk (score >= 80) or fall is detected, automatically initiates an emergency event
        if there isn't already an active event for this patient.
        """
        if assessment.risk_level != "CRITICAL" and assessment.combined_risk_score < 78.0:
            return None

        # Check for existing active event to prevent duplicate flooding
        active = (
            db.query(EmergencyEvent)
            .filter(EmergencyEvent.patient_id == packet.patient_id)
            .filter(EmergencyEvent.state.in_(["PENDING_VERIFICATION", "VERIFIED", "ESCALATED", "ACKNOWLEDGED"]))
            .first()
        )
        if active:
            return active

        # Auto-create new emergency incident
        reason = assessment.summary_narrative.split(".")[0]
        if not reason or len(reason) < 5:
            reason = f"Critical {assessment.trigger_category} detected by AI Engine"

        return EmergencyService.create_emergency_event(
            db=db,
            patient_id=packet.patient_id,
            reason=reason,
            severity="CRITICAL",
            assessment_id=assessment.id,
            reading_id=packet.reading_id,
            grace_period_seconds=45,
            actor_type="SYSTEM"
        )
