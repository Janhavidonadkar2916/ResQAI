from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import WebSocket
from sqlalchemy.orm import Session
from sqlalchemy import desc
import numpy as np

from app.models.sensor import SensorReading
from app.models.patient import Patient
from app.schemas.monitoring import (
    PatientMonitoringSummary, 
    VitalsAggregate, 
    SignalQualityDistribution
)


class ConnectionManager:
    """Manages active WebSocket subscribers for live patient telemetry streaming."""
    def __init__(self):
        # Maps patient_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, patient_id: str, websocket: WebSocket):
        await websocket.accept()
        if patient_id not in self.active_connections:
            self.active_connections[patient_id] = []
        self.active_connections[patient_id].append(websocket)

    def disconnect(self, patient_id: str, websocket: WebSocket):
        if patient_id in self.active_connections:
            if websocket in self.active_connections[patient_id]:
                self.active_connections[patient_id].remove(websocket)
            if not self.active_connections[patient_id]:
                del self.active_connections[patient_id]

    async def broadcast_to_patient(self, patient_id: str, message: dict):
        if patient_id in self.active_connections:
            for connection in self.active_connections[patient_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    # Stale connection
                    pass


ws_manager = ConnectionManager()


class MonitoringAnalyticsService:
    @staticmethod
    def get_patient_summary(
        db: Session, 
        patient_id: str, 
        hours: int = 24
    ) -> PatientMonitoringSummary:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        p_name = f"{patient.first_name} {patient.last_name}" if patient else "Unknown Patient"

        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        readings = (
            db.query(SensorReading)
            .filter(SensorReading.patient_id == patient_id)
            .filter(SensorReading.recorded_at >= cutoff)
            .order_by(desc(SensorReading.recorded_at))
            .all()
        )

        total_count = len(readings)
        last_recorded = readings[0].recorded_at if readings else None

        hr_vals = [r.heart_rate_bpm for r in readings if r.heart_rate_bpm is not None]
        spo2_vals = [r.spo2_percent for r in readings if r.spo2_percent is not None]
        temp_vals = [r.temperature_c for r in readings if r.temperature_c is not None]

        hr_stats = VitalsAggregate(
            min=round(float(min(hr_vals)), 1) if hr_vals else None,
            max=round(float(max(hr_vals)), 1) if hr_vals else None,
            avg=round(float(np.mean(hr_vals)), 1) if hr_vals else None,
            std_dev=round(float(np.std(hr_vals)), 1) if hr_vals else None,
        )

        spo2_stats = VitalsAggregate(
            min=round(float(min(spo2_vals)), 1) if spo2_vals else None,
            max=round(float(max(spo2_vals)), 1) if spo2_vals else None,
            avg=round(float(np.mean(spo2_vals)), 1) if spo2_vals else None,
            std_dev=round(float(np.std(spo2_vals)), 1) if spo2_vals else None,
        )

        temp_stats = VitalsAggregate(
            min=round(float(min(temp_vals)), 2) if temp_vals else None,
            max=round(float(max(temp_vals)), 2) if temp_vals else None,
            avg=round(float(np.mean(temp_vals)), 2) if temp_vals else None,
            std_dev=round(float(np.std(temp_vals)), 2) if temp_vals else None,
        )

        # Quality distribution
        qualities = [r.signal_quality for r in readings]
        n = max(1, len(qualities))
        quality_dist = SignalQualityDistribution(
            optimal_pct=round((qualities.count("OPTIMAL") / n) * 100.0, 1),
            acceptable_pct=round((qualities.count("ACCEPTABLE") / n) * 100.0, 1),
            degraded_pct=round((qualities.count("DEGRADED") / n) * 100.0, 1),
            disconnected_pct=round((qualities.count("DISCONNECTED") / n) * 100.0, 1),
        )

        recommendations = []
        if spo2_stats.min and spo2_stats.min < 90.0:
            recommendations.append("Recent desaturation event recorded; review supplemental oxygen protocol.")
        if hr_stats.max and hr_stats.max > 130.0:
            recommendations.append("Paroxysmal tachycardic episode observed; continuous telemetry recommended.")
        if quality_dist.disconnected_pct > 15.0:
            recommendations.append("High telemetry packet loss (>15%); verify sensor electrode placement.")
        if not recommendations:
            recommendations.append("Stable physiological trajectory observed across historical window.")

        return PatientMonitoringSummary(
            patient_id=patient_id,
            patient_name=p_name,
            time_window_hours=hours,
            total_readings=total_count,
            last_reading_at=last_recorded,
            heart_rate_stats=hr_stats,
            spo2_stats=spo2_stats,
            temperature_stats=temp_stats,
            quality_distribution=quality_dist,
            primary_risk_level=patient.risk_tier if patient else "LOW",
            active_device_status="ONLINE" if total_count > 0 else "OFFLINE",
            recommendations=recommendations
        )
