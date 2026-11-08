import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship as orm_relationship
from app.core.database import Base


class MedicalProfile(Base):
    __tablename__ = "medical_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    blood_group = Column(String(10), default="O+", nullable=False)
    allergies = Column(JSON, default=list, nullable=False)            # e.g. ["Penicillin", "Latex"]
    chronic_conditions = Column(JSON, default=list, nullable=False)   # e.g. ["Atrial Fibrillation", "Hypertension"]
    medications = Column(JSON, default=list, nullable=False)          # list of {name, dosage, frequency, instructions}
    
    dnr_order = Column(Boolean, default=False, nullable=False)
    dnr_instructions = Column(Text, nullable=True)

    primary_physician_name = Column(String(255), default="Dr. Robert Hayes, MD")
    primary_physician_phone = Column(String(50), default="+1 (555) 987-6543")
    hospital_preference = Column(String(255), default="St. Jude Memorial Hospital - Acute Care")
    general_notes = Column(Text, nullable=True)

    last_verified_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    patient = orm_relationship("Patient")

