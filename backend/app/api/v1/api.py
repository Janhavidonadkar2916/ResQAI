from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, patients, sensors, simulator

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["System Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Access"])
api_router.include_router(patients.router, prefix="/patients", tags=["Patient Management"])
api_router.include_router(sensors.router, prefix="/sensors", tags=["Sensors & Ingestion"])
api_router.include_router(simulator.router, prefix="/simulator", tags=["Virtual Simulator"])
