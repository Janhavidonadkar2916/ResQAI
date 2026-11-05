# ResQCare AI

> **AI-Assisted Health Monitoring & Emergency Response Software Platform**  
> *Long-term, research-oriented healthcare command center built for high reliability, explainability, and virtual sensor telemetry simulation.*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind_CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ⚠️ Important Clinical Disclaimer

**ResQCare AI is a software prototype created strictly for academic research, algorithmic evaluation, and virtual sensor simulation.**  
It is **not** an FDA/CE certified medical device and is **not** intended to diagnose, treat, prevent, or substitute professional medical advice. Synthetic vitals and simulated scenarios are clearly demarcated. The software does not autonomously dispatch municipal emergency services without validated authorized gateway integration.

---

## Key Platform Capabilities

1. **Virtual Sensor Telemetry Simulation (`v1.0` Contract):**
   - No physical hardware required for development and testing.
   - Generates realistic multi-modal physiological readings (Heart Rate, SpO2, Temperature, 3-Axis Accelerometer).
   - Simulates normal states, acute episodes (tachycardia, hypoxia), high-g fall impacts, sensor dropouts, and degraded signal fidelity.
   - Enforces data quality integrity: missing vitals are explicitly recorded as `MISSING_SENSORS`—never hallucinated as healthy.
2. **Modular Monolith Architecture:**
   - Single repository containing decoupled `backend/`, `frontend/`, and `shared/` schemas.
   - Built to be easily maintainable and extensible by an individual developer.
3. **Dual Database Engine Support:**
   - PostgreSQL 16 ready (via Docker Compose) with UUID primary keys and UTC timestamps.
   - Automatic fallback to local SQLite for instant zero-dependency local development and rapid test execution.
4. **Two-Tier AI & Anomaly Detection:**
   - **Tier 1:** Deterministic clinical threshold rules (bradycardia, tachycardia, hypoxia, kinematic fall signature).
   - **Tier 2:** Statistical rolling Z-scores & Isolation Forest for subtle multi-vital drift.
   - **Explainability:** Clear causal breakdowns of which vitals triggered an alert.
5. **Emergency Lifecycle State Machine:**
   - `DETECTED` → `PENDING_VERIFICATION` (with patient cancellation grace period) → `VERIFIED` → `ESCALATED` → `ACKNOWLEDGED` → `RESOLVED`.
   - Automatic escalation occurs if the patient remains unresponsive during critical events.

---

## Project Structure

```text
ResQAI/
├── backend/                  # FastAPI modular monolith application
│   ├── app/
│   │   ├── api/v1/           # API endpoints (health, sensors, patients, etc.)
│   │   ├── core/             # Database connection, security, audit utilities
│   │   ├── models/           # SQLAlchemy database entities
│   │   ├── schemas/          # Pydantic v2 validation contracts
│   │   ├── services/         # Simulator, AI Engine, Emergency lifecycle
│   │   ├── config.py         # App configuration & settings
│   │   └── main.py           # Application entrypoint & middleware
│   ├── tests/                # Pytest test suite (health, contracts, rules)
│   ├── requirements.txt      # Python dependencies
│   └── .venv/                # Local virtual environment
├── frontend/                 # React 18 + Vite + Tailwind CSS dashboard
│   ├── src/
│   │   ├── api/              # API clients & WebSocket managers
│   │   ├── components/       # Reusable command center UI components
│   │   ├── types/            # TypeScript interfaces & sensor contracts
│   │   ├── App.tsx           # Primary application container
│   │   └── main.tsx          # React DOM entrypoint
│   └── package.json          # Frontend dependencies
├── shared/
│   └── schemas/              # Canonical JSON Schema contracts (v1.0)
├── docker-compose.yml        # PostgreSQL 16 local container configuration
├── start_dev.sh              # Single-command development launcher
└── README.md
```

---

## Quick Start Guide

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm
- (Optional) Docker for PostgreSQL

### 1. Launch Everything with One Script
```bash
./start_dev.sh
```
This automatically boots:
- **FastAPI Backend:** [http://localhost:8000](http://localhost:8000) (Interactive Swagger Docs: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs))
- **React Frontend:** [http://localhost:5173](http://localhost:5173)

### 2. Manual Execution

#### Backend
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm run dev
```

### 3. Run Automated Tests

#### Backend Test Suite
```bash
PYTHONPATH=backend ./backend/.venv/bin/pytest backend/tests/
```

#### Frontend Build Verification
```bash
cd frontend
npm run build
```

---

## Development Roadmap

- [x] **Phase 0: Project Foundation** — Modular monolith structure, data contracts, FastAPI backend, React dashboard, dual-database support, automated test suite.
- [ ] **Phase 1: Software MVP** — Authentication, Patient CRUD, Virtual Sensor Simulator Service, Ingestion Pipeline, Baseline Vitals Charts.
- [ ] **Phase 2: Monitoring & Analytics** — Real-time WebSocket streaming, degraded signal handling, 3-axis accelerometer waveform visualizer.
- [ ] **Phase 3: AI Intelligence Engine** — Rule-based evaluator, fall kinematics detection, Isolation Forest anomaly scoring, explainability narrative.
- [ ] **Phase 4: Emergency Response** — Incident state machine, verification countdown, caregiver escalation workflows, notification queue.
- [ ] **Phase 5: Security & Medical Profiles** — Role-Based Access Control (RBAC), emergency medical pass, audit log trail.
- [ ] **Phase 6: Deployment & Packaging** — Multi-stage Docker builds, research benchmark dataset, demo walkthrough.

