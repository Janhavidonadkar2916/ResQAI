from datetime import datetime, timezone
import uuid
from typing import Literal, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


SignalQualityType = Literal["OPTIMAL", "ACCEPTABLE", "DEGRADED", "DISCONNECTED"]
DataQualityStatusType = Literal["VALID", "OUT_OF_BOUNDS", "INTERPOLATED", "MISSING_SENSORS", "STALE_DATA"]
ActivityLabelType = Literal[
    "RESTING", 
    "WALKING", 
    "RUNNING", 
    "TRANSITION", 
    "FALL_SUSPECTED", 
    "POST_FALL_STATIONARY", 
    "UNKNOWN"
]
SourceType = Literal["VIRTUAL_SIMULATOR", "SYNTHETIC_BENCHMARK", "WEARABLE_DEVICE"]


class SensorPacket(BaseModel):
    schema_version: Literal["1.0"] = Field(
        default="1.0", 
        description="Contract schema version"
    )
    reading_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), 
        description="Unique observation UUID"
    )
    patient_id: str = Field(
        description="Target patient UUID"
    )
    device_id: Optional[str] = Field(
        default=None, 
        description="Associated virtual or physical device identifier"
    )
    source_type: SourceType = Field(
        default="VIRTUAL_SIMULATOR", 
        description="Provenance classification"
    )
    recorded_at: datetime = Field(
        description="Timestamp when virtual sensor generated reading (UTC)"
    )
    received_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), 
        description="Timestamp when server ingested reading (UTC)"
    )
    
    # Physiological Vitals (null allowed when sensor missing/disconnected)
    heart_rate_bpm: Optional[float] = Field(
        default=None, 
        ge=0.0, 
        le=300.0, 
        description="Heart rate in beats per minute"
    )
    spo2_percent: Optional[float] = Field(
        default=None, 
        ge=0.0, 
        le=100.0, 
        description="Peripheral capillary oxygen saturation (%)"
    )
    temperature_c: Optional[float] = Field(
        default=None, 
        ge=20.0, 
        le=45.0, 
        description="Core/surface body temperature in Celsius"
    )
    
    # 3-Axis Accelerometer Kinematics (g units)
    accel_x: Optional[float] = Field(default=None, description="Lateral axis acceleration in g")
    accel_y: Optional[float] = Field(default=None, description="Longitudinal axis acceleration in g")
    accel_z: Optional[float] = Field(default=None, description="Vertical axis acceleration in g")
    
    # Activity & Sensor State
    activity_label: ActivityLabelType = Field(
        default="RESTING", 
        description="Classified or simulated activity state"
    )
    signal_quality: SignalQualityType = Field(
        default="OPTIMAL", 
        description="Hardware or transmission signal fidelity"
    )
    data_quality_status: DataQualityStatusType = Field(
        default="VALID", 
        description="Ingestion quality classification"
    )
    provenance_metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict, 
        description="Simulation generator metadata (scenario, noise, battery)"
    )

    @field_validator("data_quality_status", mode="after")
    @classmethod
    def validate_missing_sensor_status(cls, v: DataQualityStatusType, info) -> DataQualityStatusType:
        """Enforce clinical safety rule: If core vitals are absent, quality status cannot be VALID without flag."""
        values = info.data
        hr = values.get("heart_rate_bpm")
        spo2 = values.get("spo2_percent")
        temp = values.get("temperature_c")
        if (hr is None or spo2 is None or temp is None) and v == "VALID":
            return "MISSING_SENSORS"
        return v


class SensorIngestResponse(BaseModel):
    status: str = "received"
    reading_id: str
    patient_id: str
    validated: bool = True
    recorded_at: datetime
    data_quality_status: DataQualityStatusType
    message: str = "Sensor packet ingested and verified against schema v1.0"

