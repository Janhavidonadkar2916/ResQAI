from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.sensor import SensorPacket, SensorIngestResponse
from app.services.ingestion_service import IngestionService
from app.services.simulator_service import virtual_sensor_engine

router = APIRouter()

@router.post("/ingest", response_model=SensorIngestResponse, status_code=status.HTTP_201_CREATED, summary="Ingest validated sensor reading")
def ingest_reading(
    packet: SensorPacket,
    db: Session = Depends(get_db)
) -> SensorIngestResponse:
    """
    Ingests and validates a single sensor reading adhering strictly to Sensor Contract v1.0.
    Stores reading in relational database and updates in-memory low-latency telemetry cache.
    """
    if packet.schema_version != "1.0":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported schema_version '{packet.schema_version}'. Expected '1.0'."
        )
    return IngestionService.ingest_packet(db, packet)

@router.get("/patients/{patient_id}/latest", response_model=SensorPacket, summary="Get latest telemetry reading for a patient")
def get_latest_patient_reading(
    patient_id: str,
    db: Session = Depends(get_db)
) -> SensorPacket:
    """Retrieves the most recent verified observation frame for a patient."""
    reading = IngestionService.get_latest_reading(db, patient_id)
    if not reading:
        # If no reading exists in DB yet, synthesize an initial resting baseline
        return virtual_sensor_engine.generate_packet(patient_id, scenario_override="NORMAL_RESTING")
    return reading

@router.get("/patients/{patient_id}/history", response_model=List[SensorPacket], summary="Fetch historical readings for charting")
def get_patient_history(
    patient_id: str,
    limit: int = Query(default=60, ge=1, le=500),
    db: Session = Depends(get_db)
) -> List[SensorPacket]:
    """Retrieves chronological observations for rendering health trends and vitals waveforms."""
    history = IngestionService.get_history(db, patient_id, limit=limit)
    if not history:
        # Pre-seed 30 historical points if empty for instant visual feedback
        history = virtual_sensor_engine.generate_batch(patient_id, scenario="NORMAL_RESTING", count=30, interval_seconds=2)
        for p in history:
            IngestionService.ingest_packet(db, p)
    return history

@router.get("/sample", response_model=SensorPacket, summary="Generate a synthetic reference packet")
def get_sample_reading(
    scenario: Optional[str] = "NORMAL_RESTING",
    patient_id: Optional[str] = "demo-patient-sample"
) -> SensorPacket:
    """Returns an immediate reference sensor packet conforming to Contract v1.0."""
    return virtual_sensor_engine.generate_packet(patient_id, scenario_override=scenario) # type: ignore
