import time
from fastapi.testclient import TestClient
from app.services.emergency_service import EmergencyService

def test_manual_emergency_lifecycle(client: TestClient):
    # Get a patient
    patients = client.get("/api/v1/patients").json()
    pid = patients[0]["id"]

    # 1. Create emergency event
    create_req = {
        "patient_id": pid,
        "reason": "Simulated Acute Cyanotic Episode (SpO2 84%)",
        "severity": "CRITICAL",
        "grace_period_seconds": 60
    }
    create_res = client.post("/api/v1/emergencies/create", json=create_req)
    assert create_res.status_code == 201
    event = create_res.json()
    event_id = event["id"]
    assert event["state"] == "PENDING_VERIFICATION"
    assert event["severity"] == "CRITICAL"
    assert event["seconds_remaining"] is not None
    assert event["seconds_remaining"] > 0

    # Verify notification was created
    notifs = client.get("/api/v1/notifications").json()
    assert len(notifs) > 0
    assert any(n["emergency_event_id"] == event_id for n in notifs)

    # 2. Caregiver acknowledges incident
    ack_res = client.post(f"/api/v1/emergencies/{event_id}/acknowledge")
    assert ack_res.status_code == 200
    ack_event = ack_res.json()
    assert ack_event["state"] == "ACKNOWLEDGED"
    assert ack_event["acknowledged_at"] is not None

    # 3. Caregiver escalates incident
    esc_res = client.post(f"/api/v1/emergencies/{event_id}/escalate?note=Contacting+attending+physician")
    assert esc_res.status_code == 200
    assert esc_res.json()["state"] == "ESCALATED"

    # 4. Caregiver resolves incident
    res_req = {
        "resolution_notes": "Oxygen mask repositioned; SpO2 recovered to 97%; patient resting comfortably."
    }
    res_res = client.post(f"/api/v1/emergencies/{event_id}/resolve", json=res_req)
    assert res_res.status_code == 200
    res_event = res_res.json()
    assert res_event["state"] == "RESOLVED"
    assert res_event["resolved_at"] is not None
    assert "repositioned" in res_event["resolution_notes"]

    # 5. Verify timeline logs
    timeline = client.get(f"/api/v1/emergencies/{event_id}/timeline").json()
    assert len(timeline) >= 4
    actions = [log["action"] for log in timeline]
    assert "CREATED" in actions
    assert "ACKNOWLEDGED" in actions
    assert "ESCALATED" in actions
    assert "RESOLVED" in actions

def test_emergency_cancellation(client: TestClient):
    patients = client.get("/api/v1/patients").json()
    pid = patients[0]["id"]

    create_req = {
        "patient_id": pid,
        "reason": "Suspected fall motion artifact",
        "severity": "WARNING",
        "grace_period_seconds": 30
    }
    create_res = client.post("/api/v1/emergencies/create", json=create_req)
    event_id = create_res.json()["id"]

    # Cancel incident
    cancel_req = {"cancellation_reason": "Patient dropped device onto sofa; verified conscious and uninjured."}
    cancel_res = client.post(f"/api/v1/emergencies/{event_id}/cancel", json=cancel_req)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["state"] == "CANCELLED"
    assert "sofa" in cancel_res.json()["resolution_notes"]

def test_grace_period_safety_escalation(client: TestClient):
    """
    Verifies Safety Constraint:
    If verification grace period expires with zero response from the patient,
    the platform automatically transitions to VERIFIED and escalates!
    """
    patients = client.get("/api/v1/patients").json()
    pid = patients[0]["id"]

    # Create event with 0s grace period (immediately expired)
    create_req = {
        "patient_id": pid,
        "reason": "Unresponsive patient high-impact event",
        "severity": "CRITICAL",
        "grace_period_seconds": 0
    }
    create_res = client.post("/api/v1/emergencies/create", json=create_req)
    event_id = create_res.json()["id"]

    # Fetching list evaluates expirations
    get_res = client.get(f"/api/v1/emergencies/{event_id}")
    assert get_res.status_code == 200
    # Must have auto-transitioned to VERIFIED
    assert get_res.json()["state"] == "VERIFIED"

def test_notifications_lifecycle(client: TestClient):
    notifs_res = client.get("/api/v1/notifications")
    assert notifs_res.status_code == 200
    notifs = notifs_res.json()
    if notifs:
        nid = notifs[0]["id"]
        patch_res = client.patch(f"/api/v1/notifications/{nid}/read")
        assert patch_res.status_code == 200
        assert patch_res.json()["is_read"] is True

    # Acknowledge all
    ack_res = client.post("/api/v1/notifications/acknowledge-all")
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "success"
