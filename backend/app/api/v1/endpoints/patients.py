from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.patient_service import PatientService
from app.schemas.patient import (
    PatientCreate, 
    PatientUpdate, 
    PatientResponse, 
    EmergencyContactCreate, 
    EmergencyContactResponse
)
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("", response_model=List[PatientResponse], summary="List monitored patients")
def list_patients(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
) -> List[PatientResponse]:
    """Retrieve all patients accessible to the caller."""
    # Ensure demo seed exists if empty
    PatientService.seed_demo_data(db)
    user_id = current_user.id if current_user else None
    is_admin = (current_user.role == "ADMIN") if current_user else True
    patients = PatientService.list_patients(db, user_id=user_id, is_admin=is_admin)
    return [PatientResponse.model_validate(p) for p in patients]

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED, summary="Create new patient profile")
def create_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
) -> PatientResponse:
    """Create a new monitored patient profile."""
    user_id = current_user.id if current_user else None
    patient = PatientService.create_patient(db, patient_in, primary_user_id=user_id)
    return PatientResponse.model_validate(patient)

@router.get("/{patient_id}", response_model=PatientResponse, summary="Get patient profile by ID")
def get_patient(patient_id: str, db: Session = Depends(get_db)) -> PatientResponse:
    """Get complete patient details by UUID."""
    patient = PatientService.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return PatientResponse.model_validate(patient)

@router.put("/{patient_id}", response_model=PatientResponse, summary="Update patient details")
def update_patient(
    patient_id: str,
    patient_update: PatientUpdate,
    db: Session = Depends(get_db)
) -> PatientResponse:
    """Update patient demographic or monitoring state."""
    patient = PatientService.update_patient(db, patient_id, patient_update)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return PatientResponse.model_validate(patient)

@router.post("/{patient_id}/contacts", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED, summary="Add emergency contact")
def add_contact(
    patient_id: str,
    contact_in: EmergencyContactCreate,
    db: Session = Depends(get_db)
) -> EmergencyContactResponse:
    """Add an emergency contact designated for urgent alert notifications."""
    patient = PatientService.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    contact = PatientService.add_emergency_contact(db, patient_id, contact_in)
    return EmergencyContactResponse.model_validate(contact)

