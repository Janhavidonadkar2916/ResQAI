import logging
import uuid
from datetime import datetime, timezone
from typing import Generator
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy import create_engine, Column, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

logger = logging.getLogger("resqcare.database")

def get_engine():
    # If DATABASE_URL or POSTGRES_URL is provided, try connecting to PostgreSQL
    target_url = settings.DATABASE_URL or settings.POSTGRES_URL
    if target_url:
        db_url = target_url
        # Clean unrecognized query params (like Supabase pooler 'supa' param) for psycopg2 compatibility
        try:
            parsed = urlparse(db_url)
            qs = parse_qs(parsed.query)
            qs.pop("supa", None)
            clean_query = urlencode(qs, doseq=True)
            db_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, clean_query, parsed.fragment))
        except Exception:
            pass

        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        try:
            pg_engine = create_engine(
                db_url,
                pool_pre_ping=True,
                echo=False
            )
            # Test connectivity
            with pg_engine.connect() as conn:
                pass
            logger.info("Connected successfully to PostgreSQL database.")
            return pg_engine, "PostgreSQL (Supabase)"
        except Exception as e:
            logger.warning(
                f"PostgreSQL connection to {db_url} failed ({e}). "
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

