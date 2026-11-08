# ResQCare AI

> **AI-Assisted Health Monitoring & Emergency Response Software Platform**  
> *Long-term, research-oriented healthcare command center engineered for clinical explainability, fail-safe incident coordination, and virtual sensor telemetry simulation.*

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000.svg?logo=vercel&logoColor=white)](https://resqai-seven.vercel.app)
[![Supabase Database](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E.svg?logo=supabase&logoColor=white)](https://supabase.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind_CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Container-Docker_Compose-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com)
[![Tests](https://img.shields.io/badge/Tests-20%2F20%20Passing-brightgreen.svg)](backend/tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌐 Live Production Deployment

- **Live Command Center Dashboard**: [https://resqai-seven.vercel.app](https://resqai-seven.vercel.app)
- **Live Interactive API Documentation**: [https://resqai-seven.vercel.app/api/v1/docs](https://resqai-seven.vercel.app/api/v1/docs)
- **Managed Cloud Database**: Hosted on Supabase (PostgreSQL 16) with active connection pooling and automatic schema synchronization.

---

## ⚠️ Important Clinical Disclaimer

**ResQCare AI is a software prototype created strictly for academic research, algorithmic evaluation, and virtual sensor simulation.**  
It is **not** an FDA/CE certified medical device and is **not** intended to diagnose, treat, prevent, or substitute professional medical care. Synthetic vitals and simulated scenarios are clearly demarcated. The software does not autonomously dispatch municipal emergency services without validated authorized gateway integration.

---

## Key Platform Capabilities

1. **Virtual Sensor Telemetry Simulation (`v1.0` Contract):**
   - Software-first architecture completely decoupled from physical hardware (no Arduino/ESP32 required).
   - Generates realistic multi-modal physiological readings (Heart Rate, $\text{SpO}_2$, Temperature, 3-Axis Accelerometer).
   - Simulates 7 physiological scenarios: Normal Resting, Active Exercise, Tachycardia, Bradycardia, Respiratory Distress, High-g Fall Impact + Immobility, and Optical Sensor Disconnect.
   - Enforces clinical data integrity: missing vitals are explicitly recorded as `MISSING_SENSORS` with `null` fields—never hallucinated as healthy.
2. **Modular Monolith Architecture:**
   - Single clean repository containing decoupled `backend/`, `frontend/`, and canonical `shared/` contracts.
   - Zero paid cloud dependencies, perfectly maintainable and extensible by an individual developer.
3. **Dual Database Engine Support:**
   - Production-ready PostgreSQL 16 (via Docker Compose) with UUID primary keys and UTC timestamps.
   - Automatic fallback to local SQLite for instant zero-dependency local development and rapid test execution.
4. **Explainable Dual-Tier AI Engine:**
   - **Tier 1:** Deterministic clinical threshold rules based on the National Early Warning Score (NEWS2).
   - **Tier 2:** Unsupervised multivariate Isolation Forest detecting subtle non-linear multi-vital drift.
   - **Kinematic Fall Detector:** Vector magnitude trigger ($|A_{res}| \ge 3.0g$) combined with post-impact immobility window variance checking ($< 0.15g^2$).
   - **Clinical Explainability:** Percentage feature attributions summing to 100% and human-readable narrative summaries.
5. **Fail-Safe Emergency Incident State Machine:**
   - `DETECTED` $\rightarrow$ `PENDING_VERIFICATION` (with a 45-second countdown grace period) $\rightarrow$ `VERIFIED` $\rightarrow$ `ESCALATED` $\rightarrow$ `ACKNOWLEDGED` $\rightarrow$ `RESOLVED` / `CANCELLED`.
   - **Unresponsive Safety Protocol**: Silence is never treated as safety; if the 45-second grace period elapses without response, the system auto-escalates to caregiver alerts.
6. **Secure Medical Profile Vault & Tamper-Evident Audit Trail:**
   - Secure repository for blood types, allergies, active prescriptions, and Resuscitation Directives (DNR/DNAR).
   - Printable high-contrast First Responder Emergency Pass modal.
   - Append-only immutable security audit log recording every view, update, and pass export.

---

## Project Structure

```text
ResQAI/
├── backend/                       # FastAPI modular monolith application
│   ├── app/
│   │   ├── api/v1/                # REST endpoints (auth, patients, sensors, simulator, etc.)
│   │   ├── core/                  # Database engines, security, JWT authentication
│   │   ├── models/                # SQLAlchemy database entities
│   │   ├── schemas/               # Pydantic v2 validation contracts
│   │   ├── services/              # Simulator, AI Engine, Emergency lifecycle, Audit
│   │   ├── config.py              # App settings & CORS configuration
│   │   └── main.py                # ASGI application entrypoint & middleware
│   ├── tests/                     # Automated Pytest suite (20 tests covering all domains)
│   ├── Dockerfile                 # Multi-stage production Python 3.12-slim build
│   ├── requirements.txt           # Backend dependencies
│   └── .venv/                     # Local virtual environment
├── frontend/                      # React 18 + Vite + Tailwind CSS dashboard
│   ├── src/
│   │   ├── api/                   # Typed API clients & WebSocket managers
│   │   ├── components/            # Reusable Command Center UI components
│   │   │   ├── audit/             # Tamper-Evident Audit Trail Viewer
│   │   │   ├── auth/              # Persona Login & Caregiver Authentication Modal
│   │   │   ├── dashboard/         # Patient Roster & Overview Card Grid
│   │   │   ├── emergency/         # Emergency Verification Console & Timeline
│   │   │   ├── intelligence/      # AI Risk Assessment & Attribution Panels
│   │   │   ├── medical/           # Medical Profile Vault & Emergency Pass Modal
│   │   │   ├── monitoring/        # Live Vitals Charts & Kinematic 3D Vector Gauge
│   │   │   ├── notifications/     # Unread Alert Drawer with Sound Telemetry
│   │   │   └── simulator/         # Virtual Sensor Control Panel & Anomaly Ingestion
│   │   ├── types/                 # TypeScript interfaces & Sensor Contract v1.0
│   │   ├── App.tsx                # Primary Command Center layout
│   │   └── main.tsx               # React DOM entrypoint
│   ├── nginx.conf                 # Production Nginx reverse proxy configuration
│   ├── Dockerfile                 # Multi-stage Node.js to Nginx production build
│   └── package.json               # Frontend dependencies & build scripts
├── docs/                          # Comprehensive Engineering & Research Documentation
│   ├── ARCHITECTURE.md            # Modular monolithic architecture, DDD, & dataflows
│   ├── API_SPECIFICATION.md       # Complete REST & WebSocket API specification
│   ├── SENSOR_CONTRACT.md         # Sensor Contract v1.0 schema & scenario reference
│   ├── RESEARCH_NOTES.md          # Clinical baselines, kinematics, & ML formulation
│   └── USER_GUIDE.md              # Operator guide for caregivers and clinicians
├── shared/
│   └── schemas/                   # Canonical Sensor Contract v1.0 JSON Schema
├── docker-compose.yml             # Full-stack Docker Compose (PostgreSQL, Backend, Frontend)
├── start_dev.sh                   # Single-command local development launcher
└── README.md
```

---

## Technical Documentation Suite

Detailed technical specifications are located in the [`docs/`](docs/) directory:

- 📐 [**System Architecture (`docs/ARCHITECTURE.md`)**](docs/ARCHITECTURE.md): Complete domain-driven design, data pipelines, ring-buffer telemetry ingestion, and database schema diagrams.
- 🔌 [**API Specification (`docs/API_SPECIFICATION.md`)**](docs/API_SPECIFICATION.md): Complete REST endpoint catalog, request/response JSON contracts, and WebSocket frame protocols.
- 📡 [**Sensor Contract v1.0 (`docs/SENSOR_CONTRACT.md`)**](docs/SENSOR_CONTRACT.md): Ingestion contract schema, missing data protocols, and definitions for all 7 synthetic simulation scenarios.
- 🔬 [**Research & Clinical Notes (`docs/RESEARCH_NOTES.md`)**](docs/RESEARCH_NOTES.md): Clinical baselines (NEWS2), kinematic fall physics ($|A_{res}| \ge 3.0g$), Isolation Forest anomaly detection, and explainable feature attributions.
- 📖 [**User & Operator Guide (`docs/USER_GUIDE.md`)**](docs/USER_GUIDE.md): Practical walkthrough for caregivers, emergency incident response, simulation testing, and medical profile export.

---

## Quick Start Guide

### Option A: Launch with Docker Compose (Recommended for Production)

Boot the entire platform (PostgreSQL 16, FastAPI Backend, React Frontend + Nginx Reverse Proxy) with a single command:

```bash
docker-compose up --build
```

- **Frontend Command Center**: [http://localhost](http://localhost) or [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger UI)**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **PostgreSQL Database**: `localhost:5432` (User: `resqcare_user`, DB: `resqcare`)

---

### Option B: Local Development (Instant SQLite Fallback)

Prerequisites: Python 3.12+ and Node.js 18+.

#### 1. Single-Script Launcher
```bash
./start_dev.sh
```
This automatically boots:
- **FastAPI Backend**: [http://localhost:8000](http://localhost:8000) (Interactive Swagger Docs: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs))
- **React Frontend (Vite Dev Server)**: [http://localhost:5173](http://localhost:5173)

#### 2. Manual Step-by-Step

**Backend:**
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Automated Test Verification

The platform maintains an automated test suite across all architectural domains.

### Run Backend Pytest Suite
```bash
PYTHONPATH=backend ./backend/.venv/bin/pytest backend/tests/
```

**Results (20 / 20 Tests Passing):**
- `test_health.py`: Root API health, database engine synchronization, and runtime metrics.
- `test_sensor_contract.py`: Contract v1.0 validation, valid ranges, null preservation, and rejection of out-of-boundary readings.
- `test_auth.py`: User registration, bcrypt hashing, JWT issuance, and RBAC token decoding.
- `test_patients.py`: Patient demographic profile CRUD, MRN indexing, and demo patient seed checks.
- `test_simulator.py`: Virtual sensor simulation profiles, jitter noise distributions, and instant anomaly injection.
- `test_ai_engine.py`: NEWS2 rule violations, kinematic fall detection ($|A_{res}| \ge 3.0g$), Isolation Forest anomaly scores, and feature attributions.
- `test_emergency_lifecycle.py`: Emergency state transitions, 45-second verification countdown, caregiver acknowledgment, and resolution workflows.
- `test_medical_profile_audit.py`: Medical profile vault updates, emergency pass generation, and immutable audit logging.

### Verify Frontend Production Build
```bash
cd frontend
npm run build
```
Compiles TypeScript with zero errors and packages assets via Vite into `frontend/dist/`.

---

## Development Roadmap Status

- [x] **Phase 0: Project Foundation** — Modular monolith repository, Sensor Contract v1.0, FastAPI backend, React dashboard, dual-database support, automated test suite.
- [x] **Phase 1: Software MVP** — Authentication (JWT/bcrypt), Patient management, Virtual Sensor Simulator Service (7 profiles), Telemetry Ingestion Pipeline, Baseline Vitals Charts.
- [x] **Phase 2: Monitoring & Analytics** — Real-time WebSocket streaming, in-memory sliding ring buffer, Kinematic 3D vector gauge ($|A_{res}|$), 24-hour vitals statistics summary.
- [x] **Phase 3: AI Intelligence Engine** — NEWS2 clinical rule evaluator, kinematic fall detector, unsupervised Isolation Forest anomaly scoring, dynamic feature attribution (100% normalized), and narrative generation.
- [x] **Phase 4: Emergency Response** — Multi-state emergency lifecycle machine, 45-second verification grace period, caregiver escalation protocols, and in-app notification drawer.
- [x] **Phase 5: Security & Medical Profiles** — Role-Based Access Control, Secure Medical Profile Vault (allergies, meds, DNR), printable First Responder Emergency Pass, and tamper-evident audit logging.
- [x] **Phase 6: Deployment & Packaging** — Multi-stage production Dockerfiles, Nginx reverse proxy configuration, full-stack `docker-compose.yml`, and comprehensive technical documentation suite (`docs/`).

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
