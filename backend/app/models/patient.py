import uuid
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship as orm_relationship
from app.core.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    primary_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(String(20), nullable=True)  # YYYY-MM-DD
    gender = Column(String(20), default="UNSPECIFIED")
    room_or_residence = Column(String(255), default="Home / Room 101")
    monitoring_status = Column(String(50), default="ACTIVE")  # ACTIVE, PAUSED, DISCHARGED
    risk_tier = Column(String(50), default="LOW")            # LOW, MODERATE, HIGH, CRITICAL

    # Relationships
    accesses = orm_relationship("PatientAccess", back_populates="patient", cascade="all, delete-orphan")
    emergency_contacts = orm_relationship("EmergencyContact", back_populates="patient", cascade="all, delete-orphan")
    readings = orm_relationship("SensorReading", back_populates="patient", cascade="all, delete-orphan")
    devices = orm_relationship("Device", back_populates="patient", cascade="all, delete-orphan")


class PatientAccess(Base):
    __tablename__ = "patient_access"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    access_level = Column(String(50), default="FULL_ACCESS")  # OWNER, FULL_ACCESS, READ_ONLY, EMERGENCY_ONLY

    patient = orm_relationship("Patient", back_populates="accesses")
    user = orm_relationship("User", back_populates="patient_accesses")


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    relationship = Column(String(100), nullable=False)  # e.g., Daughter, Spouse, Physician
    phone_number = Column(String(50), nullable=False)
    priority_order = Column(Integer, default=1)
    is_notified_on_critical = Column(Boolean, default=True)

    patient = orm_relationship("Patient", back_populates="emergency_contacts")
