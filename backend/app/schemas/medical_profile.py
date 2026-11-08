from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.patient import EmergencyContactResponse


class MedicationItem(BaseModel):
    name: str
    dosage: str
    frequency: str
    instructions: Optional[str] = None


class MedicalProfileBase(BaseModel):
    blood_group: str = Field(default="O+", description="ABO and Rh blood group (e.g. O+, A-, B+)")
    allergies: List[str] = Field(default_factory=list, description="Allergic sensitivities (e.g. Penicillin, Latex)")
    chronic_conditions: List[str] = Field(default_factory=list, description="Pre-existing clinical diagnoses")
    medications: List[MedicationItem] = Field(default_factory=list)
    dnr_order: bool = Field(default=False, description="Do Not Resuscitate clinical directive")
    dnr_instructions: Optional[str] = None
    primary_physician_name: str = "Dr. Robert Hayes, MD"
    primary_physician_phone: str = "+1 (555) 987-6543"
    hospital_preference: str = "St. Jude Memorial Hospital - Acute Care"
    general_notes: Optional[str] = None


class MedicalProfileCreate(MedicalProfileBase):
    patient_id: str


class MedicalProfileUpdate(BaseModel):
    blood_group: Optional[str] = None
    allergies: Optional[List[str]] = None
    chronic_conditions: Optional[List[str]] = None
    medications: Optional[List[MedicationItem]] = None
    dnr_order: Optional[bool] = None
    dnr_instructions: Optional[str] = None
    primary_physician_name: Optional[str] = None
    primary_physician_phone: Optional[str] = None
    hospital_preference: Optional[str] = None
    general_notes: Optional[str] = None


class MedicalProfileResponse(MedicalProfileBase):
    id: str
    patient_id: str
    last_verified_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EmergencyPassResponse(BaseModel):
    pass_generated_at: datetime
    patient_id: str
    full_name: str
    date_of_birth: Optional[str]
    gender: Optional[str]
    room_or_residence: str
    blood_group: str
    allergies: List[str]
    chronic_conditions: List[str]
    medications: List[MedicationItem]
    dnr_order: bool
    dnr_instructions: Optional[str]
    primary_physician_name: str
    primary_physician_phone: str
    hospital_preference: str
    emergency_contacts: List[EmergencyContactResponse] = []
    clinical_disclaimer: str = "EMERGENCY CLINICAL SUMMARY: Self-reported / caregiver-managed digital record for emergency reference."

