from fastapi.testclient import TestClient

def test_user_registration_and_login(client: TestClient):
    reg_data = {
        "email": "testcaregiver@resqcare.ai",
        "password": "StrongPassword123!",
        "full_name": "Nurse Kelly",
        "role": "CAREGIVER"
    }
    # Register
    reg_res = client.post("/api/v1/auth/register", json=reg_data)
    assert reg_res.status_code == 201
    reg_json = reg_res.json()
    assert "access_token" in reg_json
    assert reg_json["user"]["email"] == "testcaregiver@resqcare.ai"
    assert reg_json["user"]["role"] == "CAREGIVER"

    # Duplicate registration should fail
    dup_res = client.post("/api/v1/auth/register", json=reg_data)
    assert dup_res.status_code == 400

    # Login
    login_data = {
        "email": "testcaregiver@resqcare.ai",
        "password": "StrongPassword123!"
    }
    login_res = client.post("/api/v1/auth/login", json=login_data)
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # Access /me
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "testcaregiver@resqcare.ai"

def test_login_invalid_credentials(client: TestClient):
    login_data = {
        "email": "nonexistent@resqcare.ai",
        "password": "WrongPassword!"
    }
    res = client.post("/api/v1/auth/login", json=login_data)
    assert res.status_code == 401

