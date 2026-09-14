import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# Falls back to a local SQLite file when DATABASE_URL isn't set (local dev).
# Anchored to this file's directory (not the process cwd) since the app is
# started with `cd app && uvicorn main:app`, which previously caused a
# relative "./school_system.db" to resolve to a different, empty database file.
_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "school_system.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.abspath(_DB_PATH)}")

# Render (and some other providers) hand out "postgres://" URLs, but SQLAlchemy
# 1.4+ requires the "postgresql://" scheme.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# connect_args={"check_same_thread": False} is required only for SQLite
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides a database session for FastAPI endpoints."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
