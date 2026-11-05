import uuid
from sqlalchemy import Column, String, Float, DateTime, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(String(36), ForeignKey("devices.id", ondelete="SET NULL"), nullable=True)
    source_type = Column(String(50), default="VIRTUAL_SIMULATOR", nullable=False)
    
    recorded_at = Column(DateTime(timezone=True), nullable=False, index=True)
    received_at = Column(DateTime(timezone=True), nullable=False)

    heart_rate_bpm = Column(Float, nullable=True)
    spo2_percent = Column(Float, nullable=True)
    temperature_c = Column(Float, nullable=True)

    accel_x = Column(Float, nullable=True)
    accel_y = Column(Float, nullable=True)
    accel_z = Column(Float, nullable=True)

    activity_label = Column(String(50), default="RESTING", nullable=False)
    signal_quality = Column(String(50), default="OPTIMAL", nullable=False)
    data_quality_status = Column(String(50), default="VALID", nullable=False)
    
    provenance_metadata = Column(JSON, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="readings")
    device = relationship("Device", back_populates="readings")

    __table_args__ = (
        Index("ix_sensor_patient_recorded", "patient_id", "recorded_at"),
    )

