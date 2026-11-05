from datetime import datetime, timezone
from fastapi import APIRouter
from app.config import settings
from app.core.database import DB_ENGINE_NAME
from app.schemas.health import SystemHealthStatus

router = APIRouter()

@router.get("", response_model=SystemHealthStatus, summary="Check platform health and runtime environment")
def get_health() -> SystemHealthStatus:
    """Returns the operational status of the ResQCare AI platform."""
    return SystemHealthStatus(
        status="operational",
        timestamp=datetime.now(timezone.utc),
        version=settings.VERSION,
        database=DB_ENGINE_NAME,
        active_simulators=0,
        disclaimer="ResQCare AI is a research and monitoring prototype using simulated sensor data. Not certified for clinical diagnosis."
    )
