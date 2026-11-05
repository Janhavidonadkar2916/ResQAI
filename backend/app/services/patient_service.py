from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.patient import Patient, PatientAccess, EmergencyContact
from app.models.device import Device
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientUpdate, EmergencyContactCreate
from app.core.security import get_password_hash


class PatientService:
    @staticmethod
    def get_patient(db: Session, patient_id: str) -> Optional[Patient]:
        return db.query(Patient).filter(Patient.id == patient_id).first()

    @staticmethod
    def list_patients(db: Session, user_id: Optional[str] = None, is_admin: bool = False) -> List[Patient]:
        if is_admin or user_id is None:
            return db.query(Patient).all()
        # Find patients directly owned or granted access
        accessible_patient_ids = (
            db.query(PatientAccess.patient_id)
            .filter(PatientAccess.user_id == user_id)
            .subquery()
        )
        return (
            db.query(Patient)
            .filter((Patient.primary_user_id == user_id) | (Patient.id.in_(accessible_patient_ids)))
            .all()
        )

    @staticmethod
    def create_patient(db: Session, patient_in: PatientCreate, primary_user_id: Optional[str] = None) -> Patient:
        patient = Patient(
            first_name=patient_in.first_name,
            last_name=patient_in.last_name,
            date_of_birth=patient_in.date_of_birth,
            gender=patient_in.gender,
            room_or_residence=patient_in.room_or_residence,
            monitoring_status=patient_in.monitoring_status,
            risk_tier=patient_in.risk_tier,
            primary_user_id=primary_user_id
        )
        db.add(patient)
        db.flush()

        # Add initial emergency contacts if provided
        if patient_in.emergency_contacts:
            for c_in in patient_in.emergency_contacts:
                contact = EmergencyContact(
                    patient_id=patient.id,
                    name=c_in.name,
                    relationship=c_in.relationship,
                    phone_number=c_in.phone_number,
                    priority_order=c_in.priority_order,
                    is_notified_on_critical=c_in.is_notified_on_critical
                )
                db.add(contact)

        # Register default virtual simulator device
        virtual_device = Device(
            patient_id=patient.id,
            device_code=f"SIM-{patient.id[:8].upper()}",
            device_type="VIRTUAL_SIMULATOR",
            status="ONLINE",
            battery_percent=98
        )
        db.add(virtual_device)

        db.commit()
        db.refresh(patient)
        return patient

    @staticmethod
    def update_patient(db: Session, patient_id: str, patient_update: PatientUpdate) -> Optional[Patient]:
        patient = PatientService.get_patient(db, patient_id)
        if not patient:
            return None
        update_data = patient_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(patient, key, value)
        db.commit()
        db.refresh(patient)
        return patient

    @staticmethod
    def add_emergency_contact(db: Session, patient_id: str, contact_in: EmergencyContactCreate) -> EmergencyContact:
        contact = EmergencyContact(
            patient_id=patient_id,
            name=contact_in.name,
            relationship=contact_in.relationship,
            phone_number=contact_in.phone_number,
            priority_order=contact_in.priority_order,
            is_notified_on_critical=contact_in.is_notified_on_critical
        )
        db.add(contact)
        db.commit()
        db.refresh(contact)
        return contact

    @staticmethod
    def seed_demo_data(db: Session):
        """Seeds initial demo caregiver and sample patients for instant portfolio demonstration."""
        demo_email = "caregiver@resqcare.ai"
        existing_user = db.query(User).filter(User.email == demo_email).first()
        if not existing_user:
            demo_user = User(
                email=demo_email,
                password_hash=get_password_hash("CaregiverSecure2026!"),
                full_name="Dr. Sarah Jenkins, RN",
                role="CAREGIVER",
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            user_id = demo_user.id
        else:
            user_id = existing_user.id

        # Check if patients exist
        if db.query(Patient).count() == 0:
            p1 = Patient(
                first_name="Eleanor",
                last_name="Vance",
                date_of_birth="1948-03-14",
                gender="FEMALE",
                room_or_residence="Room 204 - East Wing (Fall Risk)",
                monitoring_status="ACTIVE",
                risk_tier="MODERATE",
                primary_user_id=user_id
            )
            db.add(p1)
            db.flush()
            
            c1 = EmergencyContact(
                patient_id=p1.id,
                name="David Vance",
                relationship="Son",
                phone_number="+1 (555) 234-5678",
                priority_order=1,
                is_notified_on_critical=True
            )
            db.add(c1)

            dev1 = Device(
                patient_id=p1.id,
                device_code=f"SIM-ELEANOR-01",
                device_type="VIRTUAL_SIMULATOR",
                status="ONLINE",
                battery_percent=94
            )
            db.add(dev1)

            p2 = Patient(
                first_name="Arthur",
                last_name="Pendelton",
                date_of_birth="1952-11-29",
                gender="MALE",
                room_or_residence="Residence 12 - North Oak",
                monitoring_status="ACTIVE",
                risk_tier="LOW",
                primary_user_id=user_id
            )
            db.add(p2)
            db.flush()

            c2 = EmergencyContact(
                patient_id=p2.id,
                name="Martha Pendelton",
                relationship="Spouse",
                phone_number="+1 (555) 876-5432",
                priority_order=1,
                is_notified_on_critical=True
            )
            db.add(c2)

            dev2 = Device(
                patient_id=p2.id,
                device_code=f"SIM-ARTHUR-02",
                device_type="VIRTUAL_SIMULATOR",
                status="ONLINE",
                battery_percent=99
            )
            db.add(dev2)

            db.commit()
