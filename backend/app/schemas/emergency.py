from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict


EmergencySeverity = Literal["WARNING", "URGENT", "CRITICAL"]
EmergencyState = Literal[
    "DETECTED",
    "PENDING_VERIFICATION",
    "VERIFIED",
    "ESCALATED",
    "ACKNOWLEDGED",
    "RESOLVED",
    "CANCELLED"
]


class EmergencyTimelineLogResponse(BaseModel):
    id: str
    emergency_event_id: str
    action: str
    actor_type: str
    actor_id: Optional[str] = None
    description: str
    logged_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    emergency_event_id: Optional[str] = None
    title: str
    message: str
    priority: str
    is_read: bool
    is_acknowledged: bool
    sent_at: datetime
    acknowledged_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EmergencyEventResponse(BaseModel):
    id: str
    patient_id: str
    assessment_id: Optional[str] = None
    reading_id: Optional[str] = None
    severity: EmergencySeverity
    state: EmergencyState
    reason: str
    detected_at: datetime
    verification_deadline_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    acknowledged_by_user_id: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by_user_id: Optional[str] = None
    resolution_notes: Optional[str] = None
    timeline: List[EmergencyTimelineLogResponse] = []
    
    # Injected helper attributes
    patient_name: Optional[str] = None
    seconds_remaining: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class EmergencyCreateRequest(BaseModel):
    patient_id: str
    reason: str
    severity: EmergencySeverity = "CRITICAL"
    grace_period_seconds: int = Field(default=45, ge=0, le=300)


class EmergencyResolveRequest(BaseModel):
    resolution_notes: str = Field(min_length=5, description="Documentation of actions taken and patient condition")


class EmergencyCancelRequest(BaseModel):
    cancellation_reason: str = Field(min_length=3, description="Justification for cancelling incident (e.g. User verified safe)")
