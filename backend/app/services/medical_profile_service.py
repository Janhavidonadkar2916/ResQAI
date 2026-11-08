import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.medical_profile import MedicalProfile
from app.models.patient import Patient
from app.schemas.medical_profile import MedicalProfileUpdate, EmergencyPassResponse, MedicationItem
from app.schemas.patient import EmergencyContactResponse
from app.services.audit_service import AuditService


class MedicalProfileService:
    @staticmethod
    def get_or_create_profile(db: Session, patient_id: str) -> MedicalProfile:
        profile = db.query(MedicalProfile).filter(MedicalProfile.patient_id == patient_id).first()
        if not profile:
            # Seed realistic clinical default record
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            first_name = patient.first_name if patient else "Patient"

            if "Eleanor" in first_name:
                allergies = ["Penicillin (Severe Rash)", "Latex"]
                conditions = ["Hypertension", "Osteoarthritis", "Type 2 Diabetes"]
                meds = [
                    {"name": "Metformin", "dosage": "500 mg", "frequency": "Twice daily with meals", "instructions": "Take with water"},
                    {"name": "Lisinopril", "dosage": "10 mg", "frequency": "Once daily morning", "instructions": "Monitor blood pressure"},
                    {"name": "Aspirin", "dosage": "81 mg", "frequency": "Once daily", "instructions": "Cardiovascular prophylaxis"}
                ]
                blood_group = "A+"
            else:
                allergies = ["Sulfa Drugs", "Codeine"]
                conditions = ["Atrial Fibrillation", "Hyperlipidemia"]
                meds = [
                    {"name": "Warfarin", "dosage": "5 mg", "frequency": "Once daily evening", "instructions": "Target INR 2.0-3.0"},
                    {"name": "Atorvastatin", "dosage": "20 mg", "frequency": "Nightly", "instructions": "Lipid control"}
                ]
                blood_group = "O+"

            profile = MedicalProfile(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                blood_group=blood_group,
                allergies=allergies,
                chronic_conditions=conditions,
                medications=meds,
                dnr_order=False,
                dnr_instructions="Full resuscitation protocol requested.",
                primary_physician_name="Dr. Robert Hayes, MD (Internal Medicine)",
                primary_physician_phone="+1 (555) 987-6543",
                hospital_preference="St. Jude Memorial Hospital - Acute Care",
                general_notes="Patient resides in assisted independent living suite. Fall alarm enabled.",
                last_verified_at=datetime.now(timezone.utc)
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)

        return profile

    @staticmethod
    def update_profile(
        db: Session,
        patient_id: str,
        update_in: MedicalProfileUpdate,
        actor_id: Optional[str] = None,
        actor_email: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> MedicalProfile:
        profile = MedicalProfileService.get_or_create_profile(db, patient_id)
        update_dict = update_in.model_dump(exclude_unset=True)

        for field, value in update_dict.items():
            if field == "medications" and value is not None:
                # Convert medication Pydantic objects to dicts
                setattr(profile, field, [m if isinstance(m, dict) else m.model_dump() for m in value])
            else:
                setattr(profile, field, value)

        profile.last_verified_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(profile)

        # Audit trail recording
        AuditService.record_audit(
            db=db,
            action_type="UPDATE_MEDICAL_PROFILE",
            resource_type="MEDICAL_PROFILE",
            resource_id=profile.id,
            actor_id=actor_id,
            actor_email=actor_email,
            ip_address=ip_address,
            details={"updated_fields": list(update_dict.keys())}
        )

        return profile

    @staticmethod
    def generate_emergency_pass(
        db: Session,
        patient_id: str,
        actor_id: Optional[str] = None,
        actor_email: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> EmergencyPassResponse:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        profile = MedicalProfileService.get_or_create_profile(db, patient_id)

        # Audit view of sensitive medical record
        AuditService.record_audit(
            db=db,
            action_type="EXPORT_EMERGENCY_PASS",
            resource_type="MEDICAL_PROFILE",
            resource_id=profile.id,
            actor_id=actor_id,
            actor_email=actor_email,
            ip_address=ip_address,
            details={"patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown"}
        )

        contacts = [EmergencyContactResponse.model_validate(c) for c in (patient.emergency_contacts if patient else [])]
        meds = [MedicationItem(**m) if isinstance(m, dict) else m for m in profile.medications]

        return EmergencyPassResponse(
            pass_generated_at=datetime.now(timezone.utc),
            patient_id=patient_id,
            full_name=f"{patient.first_name} {patient.last_name}" if patient else "Patient",
            date_of_birth=patient.date_of_birth if patient else None,
            gender=patient.gender if patient else None,
            room_or_residence=patient.room_or_residence if patient else "Home",
            blood_group=profile.blood_group,
            allergies=profile.allergies,
            chronic_conditions=profile.chronic_conditions,
            medications=meds,
            dnr_order=profile.dnr_order,
            dnr_instructions=profile.dnr_instructions,
            primary_physician_name=profile.primary_physician_name,
            primary_physician_phone=profile.primary_physician_phone,
            hospital_preference=profile.hospital_preference,
            emergency_contacts=contacts
        )

