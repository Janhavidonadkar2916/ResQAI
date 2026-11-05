import asyncio
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db, SessionLocal
from app.schemas.monitoring import PatientMonitoringSummary
from app.services.monitoring_service import MonitoringAnalyticsService, ws_manager
from app.services.patient_service import PatientService
from app.services.simulator_service import virtual_sensor_engine
from app.services.ingestion_service import IngestionService
from app.services.ai_engine.orchestrator import IntelligenceOrchestrator

router = APIRouter()

@router.get("/patients/{patient_id}/summary", response_model=PatientMonitoringSummary, summary="Retrieve 24-hour patient telemetry summary")
def get_monitoring_summary(
    patient_id: str,
    hours: int = 24,
    db: Session = Depends(get_db)
) -> PatientMonitoringSummary:
    """Computes vitals aggregates, quality distribution, and recommendations over the specified time window."""
    patient = PatientService.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    
    return MonitoringAnalyticsService.get_patient_summary(db, patient_id, hours=hours)

@router.websocket("/ws/{patient_id}")
async def websocket_telemetry_stream(
    websocket: WebSocket,
    patient_id: str
):
    """
    Subscribes to live 1 Hz telemetry and immediate AI risk scoring for the specified patient.
    Sends real-time updates as JSON frames containing both sensor reading and AI risk dossier.
    """
    await ws_manager.connect(patient_id, websocket)
    db = SessionLocal()
    try:
        while True:
            # Generate simulated frame or fetch latest
            packet = virtual_sensor_engine.generate_packet(patient_id)
            # Ingest to DB
            IngestionService.ingest_packet(db, packet)
            # Evaluate AI assessment
            assessment = IntelligenceOrchestrator.evaluate_packet(packet=packet, db=db, persist=True)

            payload = {
                "type": "TELEMETRY_UPDATE",
                "patient_id": patient_id,
                "packet": packet.model_dump(mode="json"),
                "assessment": assessment.model_dump(mode="json")
            }
            await websocket.send_json(payload)
            # Wait 1 second (1 Hz tick rate)
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        ws_manager.disconnect(patient_id, websocket)
    except Exception as e:
        ws_manager.disconnect(patient_id, websocket)
    finally:
        db.close()

