import uuid
from sqlalchemy import Column, String, Float, DateTime, JSON, Text, ForeignKey, Index
from sqlalchemy.orm import relationship as orm_relationship
from app.core.database import Base


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    reading_id = Column(String(36), ForeignKey("sensor_readings.id", ondelete="SET NULL"), nullable=True, index=True)
    
    assessed_at = Column(DateTime(timezone=True), nullable=False, index=True)
    combined_risk_score = Column(Float, nullable=False)  # 0.0 - 100.0
    risk_level = Column(String(50), nullable=False)       # NORMAL, LOW, ELEVATED, CRITICAL
    trigger_category = Column(String(100), nullable=False) # NORMAL_BASELINE, VITALS_OUT_OF_BOUNDS, FALL_SIGNATURE, etc.
    
    # Detailed AI & Rule outputs
    rule_evaluations = Column(JSON, nullable=True)        # List of rules checked, fired, and threshold deltas
    ml_anomaly_score = Column(Float, nullable=True)       # Isolation Forest score (-1.0 to 1.0 or normalized)
    explainability_factors = Column(JSON, nullable=True)  # {"spo2": 0.60, "heart_rate": 0.30, ...}
    summary_narrative = Column(Text, nullable=False)      # Explainable text summary for clinicians/caregivers

    # Relationships
    patient = orm_relationship("Patient")
    reading = orm_relationship("SensorReading")

    __table_args__ = (
        Index("ix_risk_patient_assessed", "patient_id", "assessed_at"),
    )

