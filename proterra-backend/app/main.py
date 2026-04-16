import os

from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from .routes import leads, projects, contractors, bidding, ai_assistant, dashboard, webhooks, automations, client_portal, invoicing, reports, documents
from .seed_demo_data import seed_demo_data
from . import models

ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "")

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
app.include_router(automations.router)
app.include_router(client_portal.router)
app.include_router(invoicing.router)
app.include_router(reports.router)
app.include_router(documents.router)


@app.on_event("startup")
def startup():
    """Seed demo data on first startup if database is empty."""
    seed_demo_data()


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.post("/api/admin/reseed")
def reseed_database(
    db: Session = Depends(get_db),
    x_admin_secret: str = Header(default=""),
):
    """Reset and reseed the database with demo data. Requires ADMIN_SECRET header."""
    if not ADMIN_SECRET or x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    # Delete all data in reverse dependency order
    db.query(models.Document).delete()
    db.query(models.ActivityLog).delete()
    db.query(models.Payment).delete()
    db.query(models.InvoiceLineItem).delete()
    db.query(models.PaymentSchedule).delete()
    db.query(models.Invoice).delete()
    db.query(models.DesignApproval).delete()
    db.query(models.ClientPortalAccess).delete()
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
