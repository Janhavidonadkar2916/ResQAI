from fastapi import APIRouter
from app.api.v1.endpoints import health, sensors

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["System Health"])
api_router.include_router(sensors.router, prefix="/sensors", tags=["Sensors & Telemetry"])
