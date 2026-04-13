"""Webhook endpoints for lead capture from social media and website forms."""
from typing import Optional
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])


class WebFormLead(BaseModel):
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


@router.post("/lead")
def capture_lead(data: WebFormLead, db: Session = Depends(get_db)):
    """Universal lead capture endpoint for website forms and social media."""
    lead = models.Lead(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        property_address=data.property_address,
        city=data.city,
        state=data.state,
        zip_code=data.zip_code,
        project_type=data.project_type,
        budget_range=data.budget_range,
        timeline=data.timeline,
        source=data.source,
        notes=data.notes,
    )
    db.add(lead)
    log = models.ActivityLog(
        entity_type="lead", entity_id=lead.lead_id,
        action="created", details=f"Lead via {data.source}: {data.full_name}"
    )
    db.add(log)
    db.commit()
    db.refresh(lead)
    return {"ok": True, "lead_id": lead.lead_id}


@router.post("/facebook")
async def facebook_lead(request: Request, db: Session = Depends(get_db)):
    """Facebook Lead Ads webhook endpoint."""
    body = await request.json()

    # Facebook sends leads in entry[].changes[].value.leadgen_id format
    # For MVP, accept a simplified format
    name = body.get("full_name", body.get("name", ""))
    email = body.get("email", "")
    phone = body.get("phone", "")

    if not name:
        return {"ok": False, "error": "Missing name"}

    lead = models.Lead(
        full_name=name,
        email=email,
        phone=phone,
        property_address=body.get("property_address", ""),
        project_type=body.get("project_type", ""),
        budget_range=body.get("budget_range", ""),
        source="facebook",
        notes=f"Auto-captured from Facebook Lead Ad",
    )
    db.add(lead)
    log = models.ActivityLog(
        entity_type="lead", entity_id=lead.lead_id,
        action="created", details=f"Facebook lead: {name}"
    )
    db.add(log)
    db.commit()
    return {"ok": True, "lead_id": lead.lead_id}


@router.post("/instagram")
async def instagram_lead(request: Request, db: Session = Depends(get_db)):
    """Instagram Lead Ads webhook endpoint."""
    body = await request.json()

    name = body.get("full_name", body.get("name", ""))
    email = body.get("email", "")
    phone = body.get("phone", "")

    if not name:
        return {"ok": False, "error": "Missing name"}

    lead = models.Lead(
        full_name=name,
        email=email,
        phone=phone,
        property_address=body.get("property_address", ""),
        project_type=body.get("project_type", ""),
        budget_range=body.get("budget_range", ""),
        source="instagram",
        notes=f"Auto-captured from Instagram Lead Ad",
    )
    db.add(lead)
    log = models.ActivityLog(
        entity_type="lead", entity_id=lead.lead_id,
        action="created", details=f"Instagram lead: {name}"
    )
    db.add(log)
    db.commit()
    return {"ok": True, "lead_id": lead.lead_id}
