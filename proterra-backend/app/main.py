from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from .routes import leads, projects, contractors, bidding, ai_assistant, dashboard, webhooks
from .seed_demo_data import seed_demo_data
from . import models

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ProTerra CRM API")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Register routers
app.include_router(leads.router)
app.include_router(projects.router)
app.include_router(contractors.router)
app.include_router(bidding.router)
app.include_router(ai_assistant.router)
app.include_router(dashboard.router)
app.include_router(webhooks.router)


@app.on_event("startup")
def startup():
    """Seed demo data on first startup if database is empty."""
    seed_demo_data()


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.post("/api/admin/reseed")
def reseed_database(db: Session = Depends(get_db)):
    """Reset and reseed the database with demo data. For admin use only."""
    # Delete all data in reverse dependency order
    db.query(models.ActivityLog).delete()
    db.query(models.Bid).delete()
    db.query(models.BidPackage).delete()
    db.query(models.Task).delete()
    db.query(models.ProjectFile).delete()
    db.query(models.Project).delete()
    db.query(models.Contractor).delete()
    db.query(models.Lead).delete()
    db.commit()
    # Re-seed
    seed_demo_data()
    return {"status": "reseeded"}
