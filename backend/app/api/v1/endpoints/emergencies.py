from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.patient import Patient
from app.models.user import User
from app.api.deps import get_current_user
from app.services.emergency_service import EmergencyService
from app.schemas.emergency import (
    EmergencyEventResponse,
    EmergencyCreateRequest,
    EmergencyResolveRequest,
    EmergencyCancelRequest,
    EmergencyTimelineLogResponse
)

router = APIRouter()

def enrich_response(event, db: Session) -> EmergencyEventResponse:
    patient = db.query(Patient).filter(Patient.id == event.patient_id).first()
    p_name = f"{patient.first_name} {patient.last_name}" if patient else "Patient"
    
    # Calculate seconds remaining if in grace period
    seconds_remaining = None
    if event.state == "PENDING_VERIFICATION" and event.verification_deadline_at:
        deadline = event.verification_deadline_at
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        diff = (deadline - datetime.now(timezone.utc)).total_seconds()
        seconds_remaining = max(0, int(diff))

    resp = EmergencyEventResponse.model_validate(event)
    resp.patient_name = p_name
    resp.seconds_remaining = seconds_remaining
    return resp

@router.get("", response_model=List[EmergencyEventResponse], summary="List emergency incidents")
def list_emergencies(
    patient_id: Optional[str] = None,
    active_only: bool = False,
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db)
) -> List[EmergencyEventResponse]:
    """Retrieves emergency events matching criteria, with grace period evaluation."""
    events = EmergencyService.list_events(db, patient_id=patient_id, active_only=active_only, limit=limit)
    return [enrich_response(e, db) for e in events]

@router.get("/{event_id}", response_model=EmergencyEventResponse, summary="Get emergency incident dossier")
def get_emergency(event_id: str, db: Session = Depends(get_db)) -> EmergencyEventResponse:
    """Retrieves full incident details, timeline log, and verification status."""
    event = EmergencyService.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency incident not found")
    return enrich_response(event, db)

@router.post("/create", response_model=EmergencyEventResponse, status_code=status.HTTP_201_CREATED, summary="Trigger manual emergency incident")
def create_emergency(
    req: EmergencyCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
) -> EmergencyEventResponse:
    """Manually creates an emergency incident with grace period countdown."""
    event = EmergencyService.create_emergency_event(
        db=db,
        patient_id=req.patient_id,
        reason=req.reason,
        severity=req.severity,
        grace_period_seconds=req.grace_period_seconds,
        actor_type="CAREGIVER" if current_user else "SYSTEM",
        actor_id=current_user.id if current_user else None
    )
    return enrich_response(event, db)

@router.post("/{event_id}/acknowledge", response_model=EmergencyEventResponse, summary="Caregiver acknowledges incident")
def acknowledge_incident(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
) -> EmergencyEventResponse:
    """Halts escalation timers and documents caregiver receipt of alert."""
    user_id = current_user.id if current_user else None
    event = EmergencyService.acknowledge_event(db, event_id, user_id=user_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency incident not found")
    return enrich_response(event, db)

@router.post("/{event_id}/escalate", response_model=EmergencyEventResponse, summary="Escalate incident to secondary contacts")
def escalate_incident(
    event_id: str,
    note: Optional[str] = "Caregiver initiated secondary escalation",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
) -> EmergencyEventResponse:
    """Transitions incident to ESCALATED state and alerts backup emergency contacts."""
    user_id = current_user.id if current_user else None
    event = EmergencyService.escalate_event(db, event_id, user_id=user_id, note=note)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency incident not found")
    return enrich_response(event, db)

@router.post("/{event_id}/resolve", response_model=EmergencyEventResponse, summary="Resolve incident with clinical notes")
def resolve_incident(
    event_id: str,
    req: EmergencyResolveRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
) -> EmergencyEventResponse:
    """Closes incident and records documented clinical/caregiver resolution notes."""
    user_id = current_user.id if current_user else None
    event = EmergencyService.resolve_event(db, event_id, user_id=user_id, resolution_notes=req.resolution_notes)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency incident not found")
    return enrich_response(event, db)

@router.post("/{event_id}/cancel", response_model=EmergencyEventResponse, summary="Cancel false alarm")
def cancel_incident(
    event_id: str,
    req: EmergencyCancelRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
) -> EmergencyEventResponse:
    """Cancels incident with documented justification."""
    user_id = current_user.id if current_user else None
    event = EmergencyService.cancel_event(db, event_id, user_id=user_id, cancellation_reason=req.cancellation_reason)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency incident not found")
    return enrich_response(event, db)

@router.get("/{event_id}/timeline", response_model=List[EmergencyTimelineLogResponse], summary="Get incident timeline logs")
def get_timeline(event_id: str, db: Session = Depends(get_db)) -> List[EmergencyTimelineLogResponse]:
    """Retrieves immutable audit trail of state transitions for this incident."""
    event = EmergencyService.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency incident not found")
    return [EmergencyTimelineLogResponse.model_validate(log) for log in event.timeline]
