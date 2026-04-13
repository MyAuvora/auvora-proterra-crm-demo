"""Database configuration for ProTerra CRM."""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Use /data/app.db for persistent volume in production, local file for dev
DB_PATH = os.environ.get("DATABASE_URL", "sqlite:///./proterra.db")
if DB_PATH.startswith("sqlite"):
    engine = create_engine(DB_PATH, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DB_PATH)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
