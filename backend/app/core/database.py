import logging
import uuid
from datetime import datetime, timezone
from typing import Generator
from sqlalchemy import create_engine, Column, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

logger = logging.getLogger("resqcare.database")

def get_engine():
    # If DATABASE_URL is provided, try connecting to PostgreSQL
    if settings.DATABASE_URL:
        try:
            pg_engine = create_engine(
                settings.DATABASE_URL,
                pool_pre_ping=True,
                echo=False
            )
            # Test connectivity
            with pg_engine.connect() as conn:
                pass
            logger.info("Connected successfully to PostgreSQL database.")
            return pg_engine, "PostgreSQL 16"
        except Exception as e:
            logger.warning(
                f"PostgreSQL connection to {settings.DATABASE_URL} failed ({e}). "
                f"Falling back to local SQLite database at {settings.SQLITE_URL}."
            )
    
    # SQLite fallback
    sqlite_engine = create_engine(
        settings.SQLITE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )
    return sqlite_engine, "SQLite 3 (Local Fallback)"


engine, DB_ENGINE_NAME = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class CustomBase:
    created_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc), 
        nullable=False
    )

Base = declarative_base(cls=CustomBase)

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

