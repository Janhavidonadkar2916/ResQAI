from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.schemas.medical_profile import (
    MedicalProfileResponse,
    MedicalProfileUpdate,
    EmergencyPassResponse
)
from app.services.medical_profile_service import MedicalProfileService
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("/patients/{patient_id}", response_model=MedicalProfileResponse, summary="Get patient medical profile")
def get_medical_profile(
    patient_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
) -> MedicalProfileResponse:
    """
    Retrieves critical medical history (allergies, blood group, medications, DNR directives).
    Access is strictly logged in the tamper-evident audit trail.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    profile = MedicalProfileService.get_or_create_profile(db, patient_id)

    # Record access audit
    AuditService.record_audit(
        db=db,
        action_type="VIEW_MEDICAL_PROFILE",
        resource_type="MEDICAL_PROFILE",
        resource_id=profile.id,
        actor_id=current_user.id if current_user else None,
        actor_email=current_user.email if current_user else "anonymous@caregiver.portal",
        ip_address=request.client.host if request.client else "127.0.0.1",
        details={"patient_name": f"{patient.first_name} {patient.last_name}"}
    )

    return MedicalProfileResponse.model_validate(profile)

@router.put("/patients/{patient_id}", response_model=MedicalProfileResponse, summary="Update patient medical profile")
def update_medical_profile(
    patient_id: str,
    update_in: MedicalProfileUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
) -> MedicalProfileResponse:
    """Updates allergies, chronic conditions, and medications with audit logging."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    profile = MedicalProfileService.update_profile(
        db=db,
        patient_id=patient_id,
        update_in=update_in,
        actor_id=current_user.id if current_user else None,
        actor_email=current_user.email if current_user else "caregiver@resqcare.ai",
        ip_address=request.client.host if request.client else "127.0.0.1"
    )
    return MedicalProfileResponse.model_validate(profile)

@router.get("/patients/{patient_id}/emergency-pass", response_model=EmergencyPassResponse, summary="Export printable Emergency Medical Pass")
def export_emergency_pass(
    patient_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
) -> EmergencyPassResponse:
    """
    Compiles a high-contrast, printable emergency summary containing critical medical warnings,
    blood group, emergency contacts, and DNR orders.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    pass_data = MedicalProfileService.generate_emergency_pass(
        db=db,
        patient_id=patient_id,
        actor_id=current_user.id if current_user else None,
        actor_email=current_user.email if current_user else "caregiver@resqcare.ai",
        ip_address=request.client.host if request.client else "127.0.0.1"
    )
    return pass_data
