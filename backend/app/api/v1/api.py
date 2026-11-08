from fastapi import APIRouter
from app.api.v1.endpoints import (
    health, 
    auth, 
    patients, 
    sensors, 
    simulator, 
    intelligence, 
    monitoring,
    emergencies,
    notifications,
    medical_profiles,
    audit
)

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["System Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Access"])
api_router.include_router(patients.router, prefix="/patients", tags=["Patient Management"])
api_router.include_router(sensors.router, prefix="/sensors", tags=["Sensors & Ingestion"])
api_router.include_router(simulator.router, prefix="/simulator", tags=["Virtual Simulator"])
api_router.include_router(intelligence.router, prefix="/intelligence", tags=["AI Intelligence Engine"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["Monitoring & Analytics"])
api_router.include_router(emergencies.router, prefix="/emergencies", tags=["Emergency Response"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["In-App Notifications"])
api_router.include_router(medical_profiles.router, prefix="/medical-profiles", tags=["Medical Profile Vault"])
api_router.include_router(audit.router, prefix="/audit", tags=["Tamper-Evident Audit Logs"])
