from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "ResQCare AI"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "resqcare-ai-super-secret-development-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]
    
    # Database
    # Default to PostgreSQL, auto-fallback to SQLite when Postgres is unavailable
    DATABASE_URL: Optional[str] = None
    SQLITE_URL: str = "sqlite:///./resqcare.db"
    
    # Simulator Settings
    SIMULATOR_TICK_RATE_MS: int = 1000
    ENABLE_SYNTHETIC_DATA: bool = True
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )


settings = Settings()

