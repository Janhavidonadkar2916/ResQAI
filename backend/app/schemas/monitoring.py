from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class VitalsAggregate(BaseModel):
    min: Optional[float] = None
    max: Optional[float] = None
    avg: Optional[float] = None
    std_dev: Optional[float] = None


class SignalQualityDistribution(BaseModel):
    optimal_pct: float
    acceptable_pct: float
    degraded_pct: float
    disconnected_pct: float


class PatientMonitoringSummary(BaseModel):
    patient_id: str
    patient_name: str
    time_window_hours: int
    total_readings: int
    last_reading_at: Optional[datetime] = None
    heart_rate_stats: VitalsAggregate
    spo2_stats: VitalsAggregate
    temperature_stats: VitalsAggregate
    quality_distribution: SignalQualityDistribution
    primary_risk_level: str
    active_device_status: str
    recommendations: List[str] = []

