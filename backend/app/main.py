from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.core.database import engine, Base, DB_ENGINE_NAME
from app.api.v1.api import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("resqcare.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist in current engine
    logger.info(f"Booting {settings.PROJECT_NAME} v{settings.VERSION} using {DB_ENGINE_NAME}")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema synchronized.")
    except Exception as e:
        logger.error(f"Failed to synchronize database tables: {e}")
    yield
    # Shutdown
    logger.info("Shutting down ResQCare AI services.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
### ResQCare AI: Research-Oriented AI Health Monitoring & Emergency Response Platform

> **Clinical Prototype Notice:** ResQCare AI is a prototype platform intended for software research, 
> algorithmic anomaly detection evaluation, and virtual sensor telemetry simulation. 
> It is **not** an FDA/CE certified medical device and does not substitute professional medical care.
    """,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": settings.VERSION,
        "docs_url": f"{settings.API_V1_STR}/docs",
        "health_check": f"{settings.API_V1_STR}/health",
        "disclaimer": "Software-first prototype using simulated virtual telemetry."
    }

