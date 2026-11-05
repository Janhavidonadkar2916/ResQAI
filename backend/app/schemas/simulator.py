from typing import Literal, Optional, List
from pydantic import BaseModel, Field
from app.schemas.sensor import SensorPacket


ScenarioName = Literal[
    "NORMAL_RESTING",
    "ACTIVE_EXERCISE",
    "TACHYCARDIA_EPISODE",
    "BRADYCARDIA_EPISODE",
    "RESPIRATORY_DISTRESS",
    "FALL_IMPACT_AND_IMMOBILITY",
    "SENSOR_DISCONNECT_DROPOUT"
]


class SimulatorScenarioInfo(BaseModel):
    name: ScenarioName
    display_title: str
    description: str
    target_vitals: str
    risk_profile: str


class SimulatorConfig(BaseModel):
    patient_id: str
    scenario: ScenarioName = "NORMAL_RESTING"
    tick_rate_ms: int = Field(default=1000, ge=200, le=10000, description="Sampling interval in milliseconds")
    noise_std: float = Field(default=0.05, ge=0.0, le=1.0, description="Synthetic Gaussian noise standard deviation")
    simulated_battery_pct: int = Field(default=95, ge=0, le=100)


class SimulatorStatus(BaseModel):
    patient_id: str
    is_running: bool
    current_scenario: ScenarioName
    tick_rate_ms: int
    packet_count: int
    last_packet: Optional[SensorPacket] = None


class BatchGenerateRequest(BaseModel):
    patient_id: str
    scenario: ScenarioName = "NORMAL_RESTING"
    count: int = Field(default=30, ge=1, le=500, description="Number of sequential packets to generate")
    interval_seconds: int = Field(default=1, ge=1, le=60)
