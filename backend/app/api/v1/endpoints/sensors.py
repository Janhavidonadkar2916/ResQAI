from datetime import datetime, timezone
import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from app.schemas.sensor import SensorPacket, SensorIngestResponse

router = APIRouter()

# In-memory buffer for Phase 0 telemetry frame storage
_telemetry_cache: List[SensorPacket] = []

@router.post("/ingest", response_model=SensorIngestResponse, status_code=status.HTTP_201_CREATED, summary="Ingest validated sensor reading")
def ingest_reading(packet: SensorPacket) -> SensorIngestResponse:
    """
    Ingests and validates a single sensor reading adhering strictly to Sensor Contract v1.0.
    Ensures data provenance and prevents treating missing sensors as normal readings.
    """
    # Enforce schema version check
    if packet.schema_version != "1.0":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported schema_version '{packet.schema_version}'. Expected '1.0'."
        )
    
    # Store in memory cache (kept bounded to last 500 readings for Phase 0)
    _telemetry_cache.append(packet)
    if len(_telemetry_cache) > 500:
        _telemetry_cache.pop(0)

    return SensorIngestResponse(
        status="success",
        reading_id=packet.reading_id,
        patient_id=packet.patient_id,
        validated=True,
        recorded_at=packet.recorded_at,
        data_quality_status=packet.data_quality_status,
        message="Reading validated and stored in telemetry pipeline."
    )

@router.get("/sample", response_model=SensorPacket, summary="Generate a synthetic reference packet")
def get_sample_reading(
    scenario: Optional[str] = "NORMAL_RESTING",
    patient_id: Optional[str] = None
) -> SensorPacket:
    """
    Returns an immediate reference sensor packet conforming to Contract v1.0.
    Useful for client contract testing and UI telemetry preview.
    """
    pid = patient_id or str(uuid.uuid4())
    
    if scenario == "TACHYCARDIA":
        hr, spo2, temp, activity = 148.5, 96.0, 37.2, "RESTING"
    elif scenario == "FALL_SUSPECTED":
        hr, spo2, temp, activity = 115.0, 94.5, 36.6, "FALL_SUSPECTED"
    elif scenario == "RESPIRATORY_DISTRESS":
        hr, spo2, temp, activity = 120.0, 87.0, 38.4, "RESTING"
    else:  # NORMAL_RESTING
        hr, spo2, temp, activity = 72.0, 98.6, 36.7, "RESTING"

    return SensorPacket(
        schema_version="1.0",
        reading_id=str(uuid.uuid4()),
        patient_id=pid,
        source_type="VIRTUAL_SIMULATOR",
        recorded_at=datetime.now(timezone.utc),
        received_at=datetime.now(timezone.utc),
        heart_rate_bpm=hr,
        spo2_percent=spo2,
        temperature_c=temp,
        accel_x=0.03,
        accel_y=0.99,
        accel_z=0.08,
        activity_label=activity,
        signal_quality="OPTIMAL",
        data_quality_status="VALID",
        provenance_metadata={
            "scenario_name": scenario,
            "synthetic_noise_std": 0.05,
            "simulated_battery_pct": 98
        }
    )

@router.get("/recent", response_model=List[SensorPacket], summary="Fetch cached recent telemetry frames")
def get_recent_readings(limit: int = 50) -> List[SensorPacket]:
    """Retrieves recent frames ingested during the current runtime session."""
    return _telemetry_cache[-limit:]
