from datetime import datetime
from typing import List, Literal, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.sensor import SensorPacket


RiskLevel = Literal["NORMAL", "LOW", "ELEVATED", "CRITICAL"]


class RuleResult(BaseModel):
    rule_id: str
    rule_name: str
    status: Literal["PASSED", "WARNING", "CRITICAL_TRIGGERED"]
    observed_value: Optional[float] = None
    threshold: str
    severity_weight: float = Field(ge=0.0, le=1.0)
    message: str


class ExplainabilityFactor(BaseModel):
    feature: str
    feature_name: str
    observed_value: Optional[float] = None
    baseline_value: Optional[float] = None
    contribution_percent: float = Field(ge=0.0, le=100.0)
    direction: Literal["NORMAL", "ELEVATED", "DEPRESSED", "DISCONNECTED"]
    clinical_rationale: str


class RiskAssessmentResponse(BaseModel):
    id: str
    patient_id: str
    reading_id: Optional[str] = None
    assessed_at: datetime
    combined_risk_score: float = Field(ge=0.0, le=100.0, description="Composite risk metric (0-100)")
    risk_level: RiskLevel
    trigger_category: str
    rule_evaluations: List[RuleResult] = []
    ml_anomaly_score: Optional[float] = None
    explainability_factors: List[ExplainabilityFactor] = []
    summary_narrative: str
    model_version: str = "ResQCare-Hybrid-v1.0"
    disclaimer: str = "Research prototype risk assessment. Not a certified clinical diagnosis."

    model_config = ConfigDict(from_attributes=True)


class AssessmentEvaluationRequest(BaseModel):
    patient_id: str
    packet: SensorPacket
