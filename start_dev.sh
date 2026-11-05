#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " Starting ResQCare AI Platform (Software Simulation Mode) "
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check Python venv
if [ ! -d "backend/.venv" ]; then
    echo "Creating Python virtual environment in backend/.venv..."
    python3 -m venv backend/.venv
    ./backend/.venv/bin/pip install -r backend/requirements.txt
fi

# Check frontend node_modules
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    (cd frontend && npm install)
fi

echo "1. Starting FastAPI Backend on http://localhost:8000..."
(
    cd backend
    export PYTHONPATH=.
    ./.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!

echo "2. Starting Vite React Frontend on http://localhost:5173..."
(
    cd frontend
    npm run dev -- --host
) &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "Stopping ResQCare AI processes..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

wait
