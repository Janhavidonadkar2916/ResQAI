from fastapi.testclient import TestClient

def test_medical_profile_and_audit_trail(client: TestClient):
    # Fetch demo patient
    patients = client.get("/api/v1/patients").json()
    pid = patients[0]["id"]

    # 1. Get medical profile
    res = client.get(f"/api/v1/medical-profiles/patients/{pid}")
    assert res.status_code == 200
    profile = res.json()
    assert profile["patient_id"] == pid
    assert "blood_group" in profile
    assert len(profile["allergies"]) > 0
    assert len(profile["medications"]) > 0

    # 2. Update medical profile
    update_payload = {
        "blood_group": "AB+",
        "allergies": ["Penicillin (Severe Rash)", "Latex", "Ibuprofen"],
        "chronic_conditions": ["Hypertension", "Atrial Fibrillation", "Mild Cognitive Impairment"],
        "dnr_order": True,
        "dnr_instructions": "Comfort care only in event of cardiac arrest."
    }
    put_res = client.put(f"/api/v1/medical-profiles/patients/{pid}", json=update_payload)
    assert put_res.status_code == 200
    updated = put_res.json()
    assert updated["blood_group"] == "AB+"
    assert "Ibuprofen" in updated["allergies"]
    assert updated["dnr_order"] is True

    # 3. Export Emergency Pass
    pass_res = client.get(f"/api/v1/medical-profiles/patients/{pid}/emergency-pass")
    assert pass_res.status_code == 200
    pass_data = pass_res.json()
    assert pass_data["blood_group"] == "AB+"
    assert pass_data["dnr_order"] is True
    assert "EMERGENCY CLINICAL SUMMARY" in pass_data["clinical_disclaimer"]
    assert len(pass_data["emergency_contacts"]) > 0

    # 4. Verify Audit Logs
    audit_res = client.get("/api/v1/audit/logs")
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) >= 3
    action_types = [l["action_type"] for l in logs]
    assert "VIEW_MEDICAL_PROFILE" in action_types
    assert "UPDATE_MEDICAL_PROFILE" in action_types
    assert "EXPORT_EMERGENCY_PASS" in action_types

