import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    device_code = Column(String(100), unique=True, index=True, nullable=False)
    device_type = Column(String(50), default="VIRTUAL_SIMULATOR")  # VIRTUAL_SIMULATOR, BLE_WRISTBAND
    status = Column(String(50), default="ONLINE")                   # ONLINE, OFFLINE, DEGRADED
    battery_percent = Column(Integer, default=100)
    last_heartbeat_at = Column(DateTime(timezone=True), nullable=True)

    patient = relationship("Patient", back_populates="devices")
    readings = relationship("SensorReading", back_populates="device", cascade="all, delete-orphan")
