import uuid
from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="CAREGIVER", nullable=False)  # ADMIN, CAREGIVER, PATIENT, CLINICIAN
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    patient_accesses = relationship("PatientAccess", back_populates="user", cascade="all, delete-orphan")
