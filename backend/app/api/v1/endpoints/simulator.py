from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.simulator_service import virtual_sensor_engine, AVAILABLE_SCENARIOS
from app.services.ingestion_service import IngestionService
from app.services.patient_service import PatientService
from app.schemas.simulator import (
    SimulatorScenarioInfo, 
    SimulatorConfig, 
    SimulatorStatus, 
    BatchGenerateRequest
)
from app.schemas.sensor import SensorPacket

router = APIRouter()

@router.get("/scenarios", response_model=List[SimulatorScenarioInfo], summary="List all simulation scenarios")
def list_scenarios() -> List[SimulatorScenarioInfo]:
    """Returns the library of reproducible physiological scenarios available to simulate."""
    return AVAILABLE_SCENARIOS

@router.post("/configure", response_model=SimulatorStatus, summary="Configure simulator for a patient")
def configure_simulator(
    config: SimulatorConfig,
    db: Session = Depends(get_db)
) -> SimulatorStatus:
    """Set the active simulation scenario, sampling frequency, and noise parameters for a patient."""
    patient = PatientService.get_patient(db, config.patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    
    return virtual_sensor_engine.set_scenario(
        patient_id=config.patient_id,
        scenario=config.scenario,
        tick_rate_ms=config.tick_rate_ms
    )

@router.post("/tick", response_model=SensorPacket, summary="Generate a single simulated sensor packet")
def generate_tick(
    patient_id: str,
    persist: bool = True,
    scenario: Optional[str] = None,
    db: Session = Depends(get_db)
) -> SensorPacket:
    """
    Synthesizes the next instantaneous sensor packet conforming to Contract v1.0.
    If `persist=True`, the packet is immediately ingested into the database and cache.
    """
    packet = virtual_sensor_engine.generate_packet(
        patient_id=patient_id,
        scenario_override=scenario # type: ignore
    )
    if persist:
        IngestionService.ingest_packet(db, packet)
    return packet

@router.post("/batch", response_model=List[SensorPacket], summary="Generate and store historical telemetry batch")
def generate_batch(
    req: BatchGenerateRequest,
    db: Session = Depends(get_db)
) -> List[SensorPacket]:
    """
    Generates a historical time-series batch of simulated readings and writes them to the DB.
    Allows testing charts, trends, and downsampling immediately.
    """
    patient = PatientService.get_patient(db, req.patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    packets = virtual_sensor_engine.generate_batch(
        patient_id=req.patient_id,
        scenario=req.scenario,
        count=req.count,
        interval_seconds=req.interval_seconds
    )
    for p in packets:
        IngestionService.ingest_packet(db, p)
    return packets

@router.get("/status/{patient_id}", response_model=SimulatorStatus, summary="Get simulator status for a patient")
def get_status(patient_id: str) -> SimulatorStatus:
    """Returns the current generator metrics and last produced packet for a patient."""
    return virtual_sensor_engine.get_status(patient_id)
