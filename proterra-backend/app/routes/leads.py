"""Lead management endpoints."""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/leads", tags=["Leads"])


class LeadCreate(BaseModel):
    full_name: str
    email: str = ""
    phone: str = ""
    property_address: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    project_type: str = ""
    budget_range: str = ""
    timeline: str = ""
    source: str = "website"
    notes: str = ""


class LeadUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    property_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    project_type: Optional[str] = None
    budget_range: Optional[str] = None
    timeline: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


@router.get("")
def list_leads(
    status: Optional[str] = None,
    source: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(models.Lead)
    if status:
        q = q.filter(models.Lead.status == status)
    if source:
        q = q.filter(models.Lead.source == source)
    return q.order_by(models.Lead.created_at.desc()).all()


@router.get("/{lead_id}")
def get_lead(lead_id: str, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.lead_id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("")
def create_lead(data: LeadCreate, db: Session = Depends(get_db)):
    lead = models.Lead(**data.model_dump())
    db.add(lead)
    db.flush()
    # Log activity
    log = models.ActivityLog(
        entity_type="lead", entity_id=lead.lead_id,
        action="created", details=f"New lead: {data.full_name} from {data.source}"
    )
    db.add(log)
    db.commit()
    db.refresh(lead)
    return lead


@router.put("/{lead_id}")
def update_lead(lead_id: str, data: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.lead_id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_data = data.model_dump(exclude_unset=True)
    old_status = lead.status
    for key, value in update_data.items():
        setattr(lead, key, value)
    lead.updated_at = datetime.utcnow()

    # Log status change
    if "status" in update_data and update_data["status"] != old_status:
        log = models.ActivityLog(
            entity_type="lead", entity_id=lead_id,
            action="status_changed",
            details=f"Status: {old_status} -> {update_data['status']}"
        )
        db.add(log)

    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}")
def delete_lead(lead_id: str, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.lead_id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return {"ok": True}


@router.post("/{lead_id}/convert")
def convert_lead_to_project(lead_id: str, db: Session = Depends(get_db)):
    """Convert a lead into a project."""
    lead = db.query(models.Lead).filter(models.Lead.lead_id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Create project from lead
    project = models.Project(
        lead_id=lead.lead_id,
        client_name=lead.full_name,
        client_email=lead.email,
        client_phone=lead.phone,
        property_address=lead.property_address,
        project_type=lead.project_type,
        description=f"Converted from lead. Budget: {lead.budget_range}. Timeline: {lead.timeline}.",
        status="Survey Scheduled",
    )
    db.add(project)
    db.flush()

    # Create default task checklist
    default_tasks = [
        "Schedule drone survey",
        "Complete drone survey",
        "Process photogrammetry data",
        "Create initial 3D design",
        "Client review meeting",
        "Apply revisions",
        "Finalize design",
        "Prepare bid package",
        "Send bid invitations",
        "Review bids with client",
    ]
    for i, title in enumerate(default_tasks):
        task = models.Task(
            project_id=project.project_id,
            title=title,
            sort_order=i,
        )
        db.add(task)

    # Update lead status
    lead.status = "Signed"
    lead.updated_at = datetime.utcnow()

    log = models.ActivityLog(
        entity_type="lead", entity_id=lead_id,
        action="converted", details=f"Converted to project {project.project_id}"
    )
    db.add(log)

    db.commit()
    db.refresh(project)
    return project
