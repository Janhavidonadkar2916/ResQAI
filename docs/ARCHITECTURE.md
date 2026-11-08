# ResQCare AI — System Architecture Specification

## 1. Executive Architecture Summary

**ResQCare AI** is an AI-assisted health monitoring and emergency response software platform engineered around a modular monolithic architecture. It is designed to bridge physiological telemetry simulation, real-time streaming analytics, explainable dual-tier anomaly detection, and human-in-the-loop emergency response coordination.

The platform is strictly **software-first**, eliminating physical hardware dependencies through a virtual sensor simulation system producing calibrated synthetic readings across standard vitals (Heart Rate, $\text{SpO}_2$, Body Temperature) and 3-axis inertial kinematics (Accelerometer $X, Y, Z$).

```
+---------------------------------------------------------------------------------------+
|                                    PRESENTATION TIER                                   |
|   React 18 + TypeScript + Vite + Tailwind CSS (Deep Teal & Navy Command Center UI)     |
|   - Real-Time Vitals Charts (Recharts)    - Kinematic Vector Gauge                     |
|   - AI Insights & Attribution Breakdown    - Emergency Verification Console (45s Timer)|
|   - Secure Medical Profile Vault          - Tamper-Evident Audit Trail Viewer          |
|   - Scenario-Based Sensor Simulator        - Multi-Channel Notification Drawer          |
+---------------------------------------------------------------------------------------+
                                            |
                         HTTP REST (v1) / WebSocket Streams
                                            |
+---------------------------------------------------------------------------------------+
|                                    APPLICATION CORE                                   |
|                                FastAPI (Python 3.12)                                  |
|                                                                                       |
|  [Ingestion & Contract Validation]          [Virtual Sensor Simulator Engine]         |
|  - Schema v1.0 enforcement                  - 7 physiological scenario generators     |
|  - Null-aware provenance tracking           - Configurable tick rates & jitter        |
|  - Stale/dropout classification             - Instant anomaly & fall injection        |
|                                                                                       |
|  [Explainable Dual-Tier AI Engine]          [Emergency Response Coordinator]          |
|  - Tier 1: Deterministic Clinical Rules     - State machine (Grace period -> Escalate)|
|  - Tier 2: Unsupervised Isolation Forest    - Audit log dispatching                   |
|  - Dynamic feature attribution scoring      - In-app notification pub/sub             |
|                                                                                       |
|  [Real-Time Monitoring Hub]                 [Medical Profile Vault & Audit]           |
|  - WebSocket ConnectionManager              - Role-based authorization                |
|  - In-memory 100-sample ring buffer         - Immutable security event ledger         |
|  - Statistical 24h rolling vitals           - Offline Emergency Pass exporter         |
+---------------------------------------------------------------------------------------+
                                            |
                            SQLAlchemy ORM + Session Management
                                            |
+---------------------------------------------------------------------------------------+
|                                     DATA TIER                                         |
|                      PostgreSQL 16 (Production) / SQLite (Fallback)                   |
|  - Users (BCrypt + JWT)                     - Sensor Readings (Indexed Time-Series)   |
|  - Patients & Caregiver Grants              - Risk Assessments & Attributions         |
|  - Medical Profiles & Emergency Contacts    - Emergency Events & Incident Timelines   |
|  - Notifications                            - Immutable Audit Log Ledger              |
+---------------------------------------------------------------------------------------+
```

---

## 2. Architectural Design Principles

1. **Modular Monolith over Microservices**:
   Given single-developer constraints, all functional capabilities are co-located in structured domain packages within a unified FastAPI backend (`app/services/`). This avoids distributed consensus, network latency, and operational orchestration overhead while enforcing clean domain separation.
2. **Software-First & Hardware-Decoupled**:
   The ingest layer consumes the strictly typed **ResQCare Sensor Contract v1.0**. The ingestion pipeline does not differentiate between synthetic simulation frames and real wearable data, guaranteeing future hardware plug-and-play capability.
3. **Data Integrity & Non-Hallucination**:
   Missing sensor packets or degraded signal quality are explicitly marked with `null` fields and `MISSING_SENSORS` or `DEGRADED_SIGNAL` quality statuses. The platform never hallucinates or substitutes a default reading for missing physiological signals.
4. **Explainable Dual-Tier Intelligence**:
   Machine learning predictions are never black-box probabilities. The AI engine combines hard deterministic clinical boundaries (e.g. cardiac arrest, severe hypoxia) with multivariate statistical models (Isolation Forest), providing percentage-based feature attribution and plain-language clinical narratives.
5. **Fail-Safe Emergency State Transitions**:
   Unresponsive patients are never presumed safe. If a 45-second verification countdown elapses without acknowledgment, the platform automatically escalates the incident to caregiver alerts.
6. **Defense-in-Depth & Tamper-Evident Auditing**:
   All read and write access to sensitive medical profiles generates an immutable record in `audit_logs` tracking the actor ID, IP address, timestamp, and target resource.

---

## 3. Core Domain Modules

### A. Identity & Access Management (`backend/app/services/auth_service.py`)
- Standardized OAuth2 Password Bearer flow.
- Passwords salted and hashed with `bcrypt`.
- Statistically unique JWT access tokens signed with HMAC-SHA256 (`HS256`).
- Role-based access control supporting `PATIENT`, `CAREGIVER`, and `CLINICIAN` roles.

### B. Patient & Caregiver Management (`backend/app/services/patient_service.py`)
- Patient demographics, medical record numbers (MRN), and primary emergency contacts.
- Granular patient access delegation (`PatientAccess`) enabling multiple caregivers per patient.
- Automated database seeding on initialization with realistic demographic profiles (Eleanor Vance, Arthur Pendelton).

### C. Virtual Sensor Simulator (`backend/app/services/simulator_service.py`)
- Configurable synthetic telemetry generator with realistic baseline drift and physiological noise.
- Supports 7 distinct physiological profiles:
  1. `NORMAL_RESTING`: Stable vitals (HR 72 bpm, $\text{SpO}_2$ 98%, Temp 36.8°C, upright sedentary posture).
  2. `ACTIVE_EXERCISE`: Elevated cardiac activity (HR 135 bpm, $\text{SpO}_2$ 97%, rhythmic acceleration).
  3. `TACHYCARDIA_EPISODE`: Sudden paroxysmal heart rate spike (158 bpm) with resting posture.
  4. `BRADYCARDIA_EPISODE`: Pathological bradycardia drop (38 bpm).
  5. `RESPIRATORY_DISTRESS`: Hypoxic event ($\text{SpO}_2$ 84%, tachypnea, compensatory tachycardia).
  6. `FALL_IMPACT_AND_IMMOBILITY`: High-g impact spike ($|A_{res}| = 4.2g$) followed by horizontal prone immobility.
  7. `SENSOR_DISCONNECT_DROPOUT`: Sudden loss of optical contact ($\text{SpO}_2$ null, signal quality 0.0).

### D. Sensor Ingestion & Telemetry Pipeline (`backend/app/services/ingestion_service.py`)
- Strict Pydantic v2 contract validation before storage.
- High-performance in-memory sliding ring buffer (100 recent frames) per patient for zero-latency dashboard graphs.
- Asynchronous batch persistence to relational storage.
- Real-time fan-out to connected WebSocket clients via `ConnectionManager`.

### E. Explainable AI Intelligence Engine (`backend/app/services/ai_engine/`)
- **Rule Evaluator (`rule_evaluator.py`)**: Immediate clinical threshold checks against National Early Warning Score (NEWS2) reference ranges.
- **Fall Detector (`fall_detector.py`)**: Kinematic resultant acceleration magnitude trigger ($|A_{res}| \ge 3.0g$) combined with a post-impact low-variance immobility window ($< 0.15g^2$).
- **Unsupervised Anomaly Detector (`anomaly_detector.py`)**: Rolling multivariate Isolation Forest identifying anomalous multidimensional distributions.
- **Explainability Engine (`explainability.py`)**: Normalizes feature deviations into percentage attributions summing to 100% and constructs deterministic clinical narratives.
- **Orchestrator (`orchestrator.py`)**: Coordinates tiers, synthesizes a 0–100 Composite Risk Score, and dispatches emergencies upon Critical risk classifications.

### F. Emergency Response Coordinator (`backend/app/services/emergency_service.py`)
- Finite State Machine governing incident lifecycle:
  `DETECTED` $\rightarrow$ `PENDING_VERIFICATION` $\rightarrow$ `VERIFIED` $\rightarrow$ `ESCALATED` $\rightarrow$ `ACKNOWLEDGED` $\rightarrow$ `RESOLVED` / `CANCELLED`
- 45-second verification grace period designed to eliminate false-alarm dispatch burden while protecting unresponsive victims.
- Automated caregiver push notification generation upon verification or grace period expiration.
- Complete chronological audit log of all status transitions (`EmergencyTimelineLog`).

### G. Secure Medical Profile & Offline Pass (`backend/app/services/medical_profile_service.py`)
- Structured vault containing blood type, confirmed allergies with severity markers, current medications with dosing, chronic medical conditions, and Resuscitation Preferences (DNR/DNAR).
- Printable and exportable Emergency Medical Pass for first responders containing critical life-support directives and emergency contact telephone numbers.
- Automated dispatching of immutable audit records on every view, update, and pass export.

---

## 4. Database Schema Architecture

```
+--------------------+       1:N       +------------------------+
|       users        | <-------------- |      patient_access    |
+--------------------+                 +------------------------+
| id (UUID, PK)      |                            |
| email (Unique)     |                            |
| hashed_password    |                            |
| role               |                            |
+--------------------+                            v N:1
          |                            +------------------------+
          | 1:N                        |        patients        |
          v                            +------------------------+
+--------------------+                 | id (UUID, PK)          |
|     audit_logs     |                 | first_name, last_name  |
+--------------------+                 | date_of_birth, gender  |
| id (UUID, PK)      |                 | mrn (Unique)           |
| actor_id (FK)      |                 | monitoring_status      |
| action_type        |                 +------------------------+
| resource_type      |                   | 1:1              | 1:N
| timestamp          |                   |                  v
+--------------------+                   |         +------------------------+
                                         |         |    sensor_readings     |
                                         |         +------------------------+
                                         |         | id (UUID, PK)          |
                                         |         | patient_id (FK, Index) |
                                         |         | recorded_at (Index)    |
                                         |         | heart_rate_bpm         |
                                         |         | spo2_percent           |
                                         |         | temperature_c          |
                                         |         | accel_x, y, z          |
                                         |         | activity_label         |
                                         |         | data_quality_status    |
                                         |         +------------------------+
                                         |                  | 1:N
                                         v                  v
+--------------------+         +-------------------+  +------------------------+
|  medical_profiles  |         | emergency_events  |  |    risk_assessments    |
+--------------------+         +-------------------+  +------------------------+
| id (UUID, PK)      |         | id (UUID, PK)     |  | id (UUID, PK)          |
| patient_id (FK)    |         | patient_id (FK)   |  | patient_id (FK)        |
| blood_type         |         | status            |  | risk_score (0-100)     |
| allergies (JSONB)  |         | severity          |  | risk_level             |
| medications (JSONB)|         | trigger_reason    |  | primary_contributing   |
| dnr_order (Bool)   |         | verification_deadl|  | feature_attributions   |
+--------------------+         +-------------------+  | narrative_explanation  |
                                         | 1:N        +------------------------+
                                         v
                               +-------------------+
                               | emergency_timeline|
                               +-------------------+
                               | id (UUID, PK)     |
                               | event_id (FK)     |
                               | from_status       |
                               | to_status         |
                               | notes             |
                               +-------------------+
```
