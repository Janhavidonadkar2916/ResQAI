# ResQCare AI — REST & WebSocket API Specification

## 1. Overview & Conventions

The ResQCare AI API provides high-throughput telemetry ingestion, real-time sensor streams, explainable AI inference, emergency incident management, and secure medical profile access.

- **Base URL**: `http://localhost:8000/api/v1`
- **Data Format**: `application/json; charset=utf-8`
- **Authentication**: Bearer Token in HTTP `Authorization` header (`Authorization: Bearer <jwt_token>`)
- **Timestamp Standard**: ISO 8601 UTC format (`YYYY-MM-DDTHH:MM:SSZ`)
- **Unique Identifiers**: Standard UUID v4 strings

---

## 2. Authentication & Authorization

### `POST /auth/register`
Creates a new user account with designated role (`PATIENT`, `CAREGIVER`, `CLINICIAN`).

**Request Body:**
```json
{
  "email": "dr.smith@resqcare.ai",
  "password": "SecurePassword123!",
  "first_name": "Marcus",
  "last_name": "Smith",
  "role": "CLINICIAN",
  "phone_number": "+1-555-0199"
}
```

**Response (`201 Created`):**
```json
{
  "id": "e4b2a8d1-72f1-4613-8cf4-28e4e9b9d3e8",
  "email": "dr.smith@resqcare.ai",
  "first_name": "Marcus",
  "last_name": "Smith",
  "role": "CLINICIAN",
  "is_active": true
}
```

### `POST /auth/login`
Authenticates credentials and issues a signed JSON Web Token.

**Request Body (`application/x-www-form-urlencoded` or JSON):**
```json
{
  "username": "dr.smith@resqcare.ai",
  "password": "SecurePassword123!"
}
```

**Response (`200 OK`):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "e4b2a8d1-72f1-4613-8cf4-28e4e9b9d3e8",
    "email": "dr.smith@resqcare.ai",
    "role": "CLINICIAN"
  }
}
```

---

## 3. Patient Management

### `GET /patients`
Retrieves a paginated list of patients accessible by the authenticated user.

**Response (`200 OK`):**
```json
[
  {
    "id": "8c59f0f6-281b-4d43-9828-5690bfa09951",
    "first_name": "Eleanor",
    "last_name": "Vance",
    "date_of_birth": "1948-03-14",
    "gender": "FEMALE",
    "mrn": "MRN-1948-EV",
    "monitoring_status": "ACTIVE",
    "created_at": "2026-11-05T12:00:00Z"
  }
]
```

---

## 4. Sensor Telemetry Ingestion

### `POST /sensors/ingest`
Ingests a single sensor reading complying with Sensor Contract v1.0.

**Request Body:**
```json
{
  "schema_version": "1.0",
  "patient_id": "8c59f0f6-281b-4d43-9828-5690bfa09951",
  "source_type": "SYNTHETIC_SIMULATOR",
  "recorded_at": "2026-11-08T20:15:30.000Z",
  "heart_rate_bpm": 142.5,
  "spo2_percent": 96.0,
  "temperature_c": 37.1,
  "accel_x": 0.05,
  "accel_y": 0.98,
  "accel_z": -0.12,
  "activity_label": "RESTING",
  "signal_quality": 0.98,
  "data_quality_status": "VALID",
  "metadata": {"simulation_scenario": "TACHYCARDIA_EPISODE"}
}
```

**Response (`202 Accepted`):**
```json
{
  "status": "ACCEPTED",
  "reading_id": "a1f94d82-c51e-4509-9134-92797e59873e",
  "processed_at": "2026-11-08T20:15:30.012Z"
}
```

### `GET /sensors/latest/{patient_id}`
Returns the most recent validated sensor frame for the specified patient.

### `GET /sensors/history/{patient_id}?limit=100`
Returns chronological sensor frames within a configurable sliding window.

---

## 5. Virtual Sensor Simulator

### `POST /simulator/config`
Configures simulation parameters (active scenario, tick frequency in ms, noise amplitude).

**Request Body:**
```json
{
  "patient_id": "8c59f0f6-281b-4d43-9828-5690bfa09951",
  "scenario": "FALL_IMPACT_AND_IMMOBILITY",
  "tick_rate_ms": 1000,
  "enable_jitter": true
}
```

### `POST /simulator/inject-anomaly`
Instantly injects an acute physiological event (e.g. `FALL_IMPACT`, `CRITICAL_HYPOXIA`, `TACHYCARDIA_BURST`) into the target patient's active telemetry stream.

---

## 6. AI Intelligence & Analytics

### `GET /intelligence/assess/{patient_id}`
Triggers full multi-modal inference on the patient's recent sliding window, returning risk scores, clinical rule violations, and explainable feature attributions.

**Response (`200 OK`):**
```json
{
  "patient_id": "8c59f0f6-281b-4d43-9828-5690bfa09951",
  "assessed_at": "2026-11-08T20:16:00Z",
  "risk_score": 88,
  "risk_level": "CRITICAL",
  "primary_contributing_factor": "FALL_IMPACT_AND_IMMOBILITY",
  "feature_attributions": {
    "accel_resultant_magnitude": 65.0,
    "post_impact_immobility": 25.0,
    "heart_rate_bpm": 10.0
  },
  "narrative_explanation": "Acute fall-like deceleration event of 3.82g detected followed by immediate sustained prone immobility.",
  "rule_violations": [
    {
      "rule_id": "RULE_FALL_DETECTED",
      "severity": "CRITICAL",
      "description": "Peak resultant acceleration exceeded safety threshold of 3.0g."
    }
  ],
  "medical_disclaimer": "ResQCare AI is a prototype monitoring system and not an FDA-certified diagnostic instrument."
}
```

---

## 7. Emergency Response Management

### `GET /emergencies?status=ACTIVE`
Lists active emergency incidents awaiting caregiver verification or resolution.

### `POST /emergencies/{id}/acknowledge`
Caregiver acknowledges awareness of an active incident.

### `POST /emergencies/{id}/resolve`
Marks an emergency incident as fully resolved, appending clinician debrief notes.

**Request Body:**
```json
{
  "resolution_notes": "Caregiver attended Eleanor Vance in bedroom. Patient is conscious and stable. No fractures observed.",
  "resolved_by": "caregiver@resqcare.ai"
}
```

### `POST /emergencies/{id}/cancel`
Cancels a false alarm during or after the verification grace period.

---

## 8. Secure Medical Profiles & Passports

### `GET /medical-profiles/{patient_id}`
Retrieves the patient's medical profile vault. Dispatches an audit record automatically.

### `PUT /medical-profiles/{patient_id}`
Updates medical attributes (allergies, medications, DNR status).

### `GET /medical-profiles/{patient_id}/emergency-pass`
Generates a consolidated, high-contrast offline Emergency Pass intended for first responders and paramedics.

---

## 9. Security Audit Trail

### `GET /audit/logs?limit=50&action_type=VIEW_MEDICAL_PROFILE`
Queries the immutable audit ledger.

---

## 10. Real-Time WebSocket Streaming

### `WebSocket /ws/monitoring/{patient_id}`
Subscribes client to live telemetry frames and AI anomaly triggers.

**Server-to-Client Frame Format:**
```json
{
  "type": "SENSOR_FRAME",
  "patient_id": "8c59f0f6-281b-4d43-9828-5690bfa09951",
  "data": {
    "recorded_at": "2026-11-08T20:16:30Z",
    "heart_rate_bpm": 74.2,
    "spo2_percent": 98.0,
    "temperature_c": 36.8,
    "accel_x": 0.02,
    "accel_y": 0.99,
    "accel_z": -0.04,
    "activity_label": "RESTING",
    "signal_quality": 1.0,
    "data_quality_status": "VALID"
  }
}
```

