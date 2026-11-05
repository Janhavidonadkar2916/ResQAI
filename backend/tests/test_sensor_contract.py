import uuid
from datetime import datetime, timezone
from fastapi.testclient import TestClient

def test_sensor_sample_generation(client: TestClient):
    response = client.get("/api/v1/sensors/sample")
    assert response.status_code == 200
    data = response.json()
    assert data["schema_version"] == "1.0"
    assert data["source_type"] == "VIRTUAL_SIMULATOR"
    assert "heart_rate_bpm" in data
    assert "spo2_percent" in data
    assert "temperature_c" in data
    assert data["data_quality_status"] == "VALID"

def test_sensor_ingestion_valid_payload(client: TestClient):
    payload = {
        "schema_version": "1.0",
        "reading_id": str(uuid.uuid4()),
        "patient_id": str(uuid.uuid4()),
        "source_type": "VIRTUAL_SIMULATOR",
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "heart_rate_bpm": 82.5,
        "spo2_percent": 97.2,
        "temperature_c": 36.9,
        "accel_x": 0.05,
        "accel_y": 0.98,
        "accel_z": 0.12,
        "activity_label": "RESTING",
        "signal_quality": "OPTIMAL",
        "data_quality_status": "VALID",
        "provenance_metadata": {"scenario_name": "NORMAL_RESTING"}
    }
    response = client.post("/api/v1/sensors/ingest", json=payload)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["status"] == "success"
    assert res_data["validated"] is True
    assert res_data["data_quality_status"] == "VALID"

def test_sensor_missing_vitals_flagged(client: TestClient):
    # When core vitals are None, quality status should not remain VALID
    payload = {
        "schema_version": "1.0",
        "reading_id": str(uuid.uuid4()),
        "patient_id": str(uuid.uuid4()),
        "source_type": "VIRTUAL_SIMULATOR",
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "heart_rate_bpm": None,  # Disconnected HR sensor
        "spo2_percent": 97.0,
        "temperature_c": 36.8,
        "activity_label": "RESTING",
        "signal_quality": "DEGRADED",
        "data_quality_status": "VALID"  # Client claims valid, validator must override
    }
    response = client.post("/api/v1/sensors/ingest", json=payload)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["data_quality_status"] == "MISSING_SENSORS"

def test_sensor_ingestion_invalid_schema_version(client: TestClient):
    payload = {
        "schema_version": "9.9",  # Unsupported version
        "reading_id": str(uuid.uuid4()),
        "patient_id": str(uuid.uuid4()),
        "source_type": "VIRTUAL_SIMULATOR",
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "signal_quality": "OPTIMAL",
        "data_quality_status": "VALID"
    }
    response = client.post("/api/v1/sensors/ingest", json=payload)
    assert response.status_code == 422

def test_sensor_ingestion_out_of_bounds_spo2(client: TestClient):
    payload = {
        "schema_version": "1.0",
        "reading_id": str(uuid.uuid4()),
        "patient_id": str(uuid.uuid4()),
        "source_type": "VIRTUAL_SIMULATOR",
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "spo2_percent": 150.0,  # Impossible SpO2
        "signal_quality": "OPTIMAL",
        "data_quality_status": "VALID"
    }
    response = client.post("/api/v1/sensors/ingest", json=payload)
    assert response.status_code == 422

