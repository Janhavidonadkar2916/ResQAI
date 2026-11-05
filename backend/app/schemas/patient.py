from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict


MonitoringStatus = Literal["ACTIVE", "PAUSED", "DISCHARGED"]
RiskTier = Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]
AccessLevel = Literal["OWNER", "FULL_ACCESS", "READ_ONLY", "EMERGENCY_ONLY"]


class EmergencyContactBase(BaseModel):
    name: str
    relationship: str
    phone_number: str
    priority_order: int = 1
    is_notified_on_critical: bool = True


class EmergencyContactCreate(EmergencyContactBase):
    pass


class EmergencyContactResponse(EmergencyContactBase):
    id: str
    patient_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PatientBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: Optional[str] = Field(default="1955-06-12", description="YYYY-MM-DD")
    gender: Optional[str] = "UNSPECIFIED"
    room_or_residence: str = "Home"
    monitoring_status: MonitoringStatus = "ACTIVE"
    risk_tier: RiskTier = "LOW"


class PatientCreate(PatientBase):
    emergency_contacts: Optional[List[EmergencyContactCreate]] = None


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    room_or_residence: Optional[str] = None
    monitoring_status: Optional[MonitoringStatus] = None
    risk_tier: Optional[RiskTier] = None


class PatientResponse(PatientBase):
    id: str
    primary_user_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    emergency_contacts: List[EmergencyContactResponse] = []

    model_config = ConfigDict(from_attributes=True)


class PatientAccessGrant(BaseModel):
    user_id: str
    access_level: AccessLevel = "FULL_ACCESS"


class PatientAccessResponse(BaseModel):
    id: str
    patient_id: str
    user_id: str
    access_level: AccessLevel
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
