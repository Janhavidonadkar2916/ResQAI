from fastapi.testclient import TestClient

def test_patient_crud(client: TestClient):
    # Initial list (should include seeded demo patients)
    list_res = client.get("/api/v1/patients")
    assert list_res.status_code == 200
    patients = list_res.json()
    assert len(patients) >= 2

    # Create new patient
    new_patient = {
        "first_name": "Thomas",
        "last_name": "Edison",
        "date_of_birth": "1942-02-11",
        "gender": "MALE",
        "room_or_residence": "Room 301 - West Wing",
        "monitoring_status": "ACTIVE",
        "risk_tier": "HIGH",
        "emergency_contacts": [
            {
                "name": "Mina Edison",
                "relationship": "Spouse",
                "phone_number": "+1 (555) 345-6789",
                "priority_order": 1,
                "is_notified_on_critical": True
            }
        ]
    }
    create_res = client.post("/api/v1/patients", json=new_patient)
    assert create_res.status_code == 201
    created_json = create_res.json()
    patient_id = created_json["id"]
    assert created_json["first_name"] == "Thomas"
    assert len(created_json["emergency_contacts"]) == 1

    # Fetch by ID
    get_res = client.get(f"/api/v1/patients/{patient_id}")
    assert get_res.status_code == 200
    assert get_res.json()["last_name"] == "Edison"

    # Update patient
    update_data = {"room_or_residence": "Room 302 - Transferred", "risk_tier": "MODERATE"}
    put_res = client.put(f"/api/v1/patients/{patient_id}", json=update_data)
    assert put_res.status_code == 200
    assert put_res.json()["room_or_residence"] == "Room 302 - Transferred"
    assert put_res.json()["risk_tier"] == "MODERATE"
