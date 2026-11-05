from datetime import datetime, timezone
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.sensor import SensorReading
from app.models.patient import Patient
from app.schemas.sensor import SensorPacket, SensorIngestResponse


class IngestionService:
    # Fast in-memory cache keyed by patient_id: stores the latest 100 packets per patient
    _recent_cache: Dict[str, List[SensorPacket]] = {}

    @classmethod
    def ingest_packet(cls, db: Session, packet: SensorPacket) -> SensorIngestResponse:
        # 1. Update in-memory ring buffer
        if packet.patient_id not in cls._recent_cache:
            cls._recent_cache[packet.patient_id] = []
        cls._recent_cache[packet.patient_id].append(packet)
        if len(cls._recent_cache[packet.patient_id]) > 200:
            cls._recent_cache[packet.patient_id].pop(0)

        # 2. Persist to relational database (PostgreSQL / SQLite)
        db_reading = SensorReading(
            id=packet.reading_id,
            patient_id=packet.patient_id,
            device_id=packet.device_id,
            source_type=packet.source_type,
            recorded_at=packet.recorded_at,
            received_at=packet.received_at,
            heart_rate_bpm=packet.heart_rate_bpm,
            spo2_percent=packet.spo2_percent,
            temperature_c=packet.temperature_c,
            accel_x=packet.accel_x,
            accel_y=packet.accel_y,
            accel_z=packet.accel_z,
            activity_label=packet.activity_label,
            signal_quality=packet.signal_quality,
            data_quality_status=packet.data_quality_status,
            provenance_metadata=packet.provenance_metadata
        )
        db.add(db_reading)
        db.commit()

        return SensorIngestResponse(
            status="success",
            reading_id=packet.reading_id,
            patient_id=packet.patient_id,
            validated=True,
            recorded_at=packet.recorded_at,
            data_quality_status=packet.data_quality_status,
            message="Packet persisted to database."
        )

    @classmethod
    def get_latest_reading(cls, db: Session, patient_id: str) -> Optional[SensorPacket]:
        # Check in-memory cache first for highest performance
        if patient_id in cls._recent_cache and cls._recent_cache[patient_id]:
            return cls._recent_cache[patient_id][-1]
        
        # Fall back to DB query
        reading = (
            db.query(SensorReading)
            .filter(SensorReading.patient_id == patient_id)
            .order_by(desc(SensorReading.recorded_at))
            .first()
        )
        if not reading:
            return None

        return SensorPacket(
            schema_version="1.0",
            reading_id=reading.id,
            patient_id=reading.patient_id,
            device_id=reading.device_id,
            source_type=reading.source_type, # type: ignore
            recorded_at=reading.recorded_at,
            received_at=reading.received_at,
            heart_rate_bpm=reading.heart_rate_bpm,
            spo2_percent=reading.spo2_percent,
            temperature_c=reading.temperature_c,
            accel_x=reading.accel_x,
            accel_y=reading.accel_y,
            accel_z=reading.accel_z,
            activity_label=reading.activity_label, # type: ignore
            signal_quality=reading.signal_quality, # type: ignore
            data_quality_status=reading.data_quality_status, # type: ignore
            provenance_metadata=reading.provenance_metadata
        )

    @classmethod
    def get_history(
        cls, 
        db: Session, 
        patient_id: str, 
        limit: int = 60,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[SensorPacket]:
        query = db.query(SensorReading).filter(SensorReading.patient_id == patient_id)
        if start_time:
            query = query.filter(SensorReading.recorded_at >= start_time)
        if end_time:
            query = query.filter(SensorReading.recorded_at <= end_time)
        
        readings = query.order_by(desc(SensorReading.recorded_at)).limit(limit).all()
        # Return in ascending chronological order for charts
        readings.reverse()

        return [
            SensorPacket(
                schema_version="1.0",
                reading_id=r.id,
                patient_id=r.patient_id,
                device_id=r.device_id,
                source_type=r.source_type, # type: ignore
                recorded_at=r.recorded_at,
                received_at=r.received_at,
                heart_rate_bpm=r.heart_rate_bpm,
                spo2_percent=r.spo2_percent,
                temperature_c=r.temperature_c,
                accel_x=r.accel_x,
                accel_y=r.accel_y,
                accel_z=r.accel_z,
                activity_label=r.activity_label, # type: ignore
                signal_quality=r.signal_quality, # type: ignore
                data_quality_status=r.data_quality_status, # type: ignore
                provenance_metadata=r.provenance_metadata
            )
            for r in readings
        ]
