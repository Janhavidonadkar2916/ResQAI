from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.intelligence import RiskAssessment
from app.schemas.sensor import SensorPacket
from app.schemas.intelligence import RiskAssessmentResponse, AssessmentEvaluationRequest
from app.services.ai_engine.orchestrator import IntelligenceOrchestrator
from app.services.ingestion_service import IngestionService
from app.services.patient_service import PatientService
from app.services.simulator_service import virtual_sensor_engine

router = APIRouter()

@router.get("/patients/{patient_id}/latest-assessment", response_model=RiskAssessmentResponse, summary="Get latest AI risk assessment for a patient")
def get_latest_assessment(
    patient_id: str,
    db: Session = Depends(get_db)
) -> RiskAssessmentResponse:
    """
    Evaluates the most recent sensor reading using the Two-Tier AI Intelligence Engine
    (Clinical Baseline Rules + Kinematic Fall Detector + Isolation Forest Anomaly Detection).
    """
    patient = PatientService.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    # Fetch latest reading
    latest_packet = IngestionService.get_latest_reading(db, patient_id)
    if not latest_packet:
        latest_packet = virtual_sensor_engine.generate_packet(patient_id, scenario_override="NORMAL_RESTING")

    # Run AI evaluation
    assessment = IntelligenceOrchestrator.evaluate_packet(packet=latest_packet, db=db, persist=True)
    return assessment

@router.get("/patients/{patient_id}/assessments", response_model=List[RiskAssessmentResponse], summary="List historical risk assessments")
def list_assessments(
    patient_id: str,
    limit: int = Query(default=30, ge=1, le=200),
    db: Session = Depends(get_db)
) -> List[RiskAssessmentResponse]:
    """Retrieves chronological risk assessments evaluated for a patient."""
    records = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.patient_id == patient_id)
        .order_by(desc(RiskAssessment.assessed_at))
        .limit(limit)
        .all()
    )
    return [RiskAssessmentResponse.model_validate(r) for r in records]

@router.post("/evaluate", response_model=RiskAssessmentResponse, summary="On-demand AI evaluation of arbitrary packet")
def evaluate_arbitrary_packet(
    req: AssessmentEvaluationRequest,
    db: Session = Depends(get_db)
) -> RiskAssessmentResponse:
    """
    Runs the hybrid AI engine on any provided sensor packet without requiring prior persistence.
    Returns composite risk score, rule breakdown, and explainability feature attribution.
    """
    return IntelligenceOrchestrator.evaluate_packet(packet=req.packet, db=db, persist=False)

