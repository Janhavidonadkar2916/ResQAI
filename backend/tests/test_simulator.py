import uuid
from fastapi.testclient import TestClient

def test_simulator_scenarios_and_ticks(client: TestClient):
    # List scenarios
    scenarios_res = client.get("/api/v1/simulator/scenarios")
    assert scenarios_res.status_code == 200
    scenarios = scenarios_res.json()
    assert len(scenarios) >= 5
    names = [s["name"] for s in scenarios]
    assert "NORMAL_RESTING" in names
    assert "TACHYCARDIA_EPISODE" in names
    assert "FALL_IMPACT_AND_IMMOBILITY" in names
    assert "SENSOR_DISCONNECT_DROPOUT" in names

    # Fetch patient ID
    patients = client.get("/api/v1/patients").json()
    pid = patients[0]["id"]

    # Generate single tick
    tick_res = client.post(f"/api/v1/simulator/tick?patient_id={pid}&scenario=TACHYCARDIA_EPISODE")
    assert tick_res.status_code == 200
    tick_packet = tick_res.json()
    assert tick_packet["patient_id"] == pid
    assert tick_packet["heart_rate_bpm"] > 135.0  # Tachycardia threshold
    assert tick_packet["schema_version"] == "1.0"

    # Generate Fall tick
    fall_res = client.post(f"/api/v1/simulator/tick?patient_id={pid}&scenario=FALL_IMPACT_AND_IMMOBILITY")
    assert fall_res.status_code == 200
    fall_packet = fall_res.json()
    assert fall_packet["activity_label"] in ["TRANSITION", "FALL_SUSPECTED", "POST_FALL_STATIONARY"]

    # Generate Disconnected sensor tick
    drop_res = client.post(f"/api/v1/simulator/tick?patient_id={pid}&scenario=SENSOR_DISCONNECT_DROPOUT")
    assert drop_res.status_code == 200
    drop_packet = drop_res.json()
    assert drop_packet["heart_rate_bpm"] is None
    assert drop_packet["signal_quality"] == "DISCONNECTED"
    assert drop_packet["data_quality_status"] == "MISSING_SENSORS"

    # Batch generation
    batch_req = {
        "patient_id": pid,
        "scenario": "NORMAL_RESTING",
        "count": 10,
        "interval_seconds": 1
    }
    batch_res = client.post("/api/v1/simulator/batch", json=batch_req)
    assert batch_res.status_code == 200
    batch_data = batch_res.json()
    assert len(batch_data) == 10
