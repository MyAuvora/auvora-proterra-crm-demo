"""AI Assistant (Ask Auvora) for ProTerra CRM."""
import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

SYSTEM_PROMPT = """You are the Auvora AI Assistant for ProTerra Outdoor Design CRM.

ProTerra Outdoor Design is a design-first outdoor living consultancy run by Jeremy Ruben.
They help homeowners plan custom pools, outdoor living spaces, and backyard transformations
BEFORE construction begins. They do NOT build anything themselves.

Their process:
1. Property mapping via drone (FAA Part 107 certified)
2. 3D visualization and design planning
3. Controlled contractor bidding (all contractors bid from identical plans)
4. Construction oversight

Service area: Florida and Alabama Gulf and Emerald Coasts.

You help Jeremy manage leads, projects, contractors, and the bidding process.
You have access to real-time CRM data and can answer questions about:
- Lead pipeline and conversion metrics
- Project status and progress
- Contractor database and bid comparisons
- Business analytics and trends
- Best practices for outdoor design project management

Be concise, professional, and actionable. Format responses with clear structure.
When discussing bids, always emphasize the apples-to-apples comparison advantage.
"""


class AskRequest(BaseModel):
    question: str
    context: Optional[str] = None


def _build_data_context(db: Session) -> str:
    """Build a context string from current CRM data."""
    leads_total = db.query(models.Lead).count()
    leads_new = db.query(models.Lead).filter(models.Lead.status == "New Lead").count()
    leads_contacted = db.query(models.Lead).filter(models.Lead.status == "Contacted").count()
    leads_signed = db.query(models.Lead).filter(models.Lead.status == "Signed").count()

    projects_total = db.query(models.Project).count()
    projects_active = db.query(models.Project).filter(
        models.Project.status.notin_(["Complete", "Cancelled"])
    ).count()

    contractors_total = db.query(models.Contractor).filter(models.Contractor.active == True).count()

    bids_total = db.query(models.Bid).count()
    bids_awarded = db.query(models.Bid).filter(models.Bid.status == "Awarded").count()
    open_packages = db.query(models.BidPackage).filter(models.BidPackage.status == "Open").count()

    pipeline_value = db.query(func.sum(models.Project.budget_estimate)).scalar() or 0

    # Recent leads
    recent_leads = db.query(models.Lead).order_by(models.Lead.created_at.desc()).limit(5).all()
    recent_leads_str = "\n".join([
        f"  - {l.full_name} ({l.status}) - {l.project_type} - {l.source}"
        for l in recent_leads
    ]) if recent_leads else "  None"

    # Active projects
    active_projects = db.query(models.Project).filter(
        models.Project.status.notin_(["Complete", "Cancelled"])
    ).order_by(models.Project.created_at.desc()).limit(5).all()
    active_projects_str = "\n".join([
        f"  - {p.client_name}: {p.project_type} ({p.status}) - ${p.budget_estimate:,.0f}"
        for p in active_projects
    ]) if active_projects else "  None"

    # Leads by source
    source_counts = db.query(
        models.Lead.source, func.count(models.Lead.lead_id)
    ).group_by(models.Lead.source).all()
    source_str = ", ".join([f"{s[0]}: {s[1]}" for s in source_counts]) if source_counts else "None"

    return f"""
CURRENT CRM DATA:
═══════════════════
LEADS: {leads_total} total | {leads_new} new | {leads_contacted} contacted | {leads_signed} signed
Lead sources: {source_str}
Conversion rate: {round(leads_signed/leads_total*100, 1) if leads_total > 0 else 0}%

PROJECTS: {projects_total} total | {projects_active} active
Pipeline value: ${pipeline_value:,.0f}

CONTRACTORS: {contractors_total} active

BIDDING: {bids_total} total bids | {bids_awarded} awarded | {open_packages} open bid packages

Recent leads:
{recent_leads_str}

Active projects:
{active_projects_str}
"""


@router.post("/ask")
def ask_auvora(data: AskRequest, db: Session = Depends(get_db)):
    """Ask the AI assistant a question about the CRM or business."""
    if not OPENAI_API_KEY:
        return _fallback_response(data.question, db)

    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)

        data_context = _build_data_context(db)
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT + "\n" + data_context},
        ]
        if data.context:
            messages.append({"role": "system", "content": f"Additional context: {data.context}"})
        messages.append({"role": "user", "content": data.question})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
            temperature=0.7,
        )
        answer = response.choices[0].message.content
        return {"answer": answer, "source": "ai"}

    except Exception as e:
        return _fallback_response(data.question, db)


def _fallback_response(question: str, db: Session) -> dict:
    """Provide a helpful response without OpenAI API."""
    q_lower = question.lower()

    leads_total = db.query(models.Lead).count()
    projects_total = db.query(models.Project).count()
    contractors_total = db.query(models.Contractor).filter(models.Contractor.active == True).count()

    if any(w in q_lower for w in ["lead", "pipeline", "prospect"]):
        new_count = db.query(models.Lead).filter(models.Lead.status == "New Lead").count()
        signed = db.query(models.Lead).filter(models.Lead.status == "Signed").count()
        return {
            "answer": f"**Lead Pipeline Summary:**\n\n"
                      f"- Total leads: **{leads_total}**\n"
                      f"- New leads: **{new_count}**\n"
                      f"- Signed: **{signed}**\n"
                      f"- Conversion rate: **{round(signed/leads_total*100,1) if leads_total > 0 else 0}%**\n\n"
                      f"Check the Leads page for the full pipeline board.",
            "source": "system"
        }

    if any(w in q_lower for w in ["project", "active", "status"]):
        active = db.query(models.Project).filter(
            models.Project.status.notin_(["Complete", "Cancelled"])
        ).count()
        pipeline = db.query(func.sum(models.Project.budget_estimate)).scalar() or 0
        return {
            "answer": f"**Project Overview:**\n\n"
                      f"- Total projects: **{projects_total}**\n"
                      f"- Active projects: **{active}**\n"
                      f"- Pipeline value: **${pipeline:,.0f}**\n\n"
                      f"View the Projects page for detailed Kanban tracking.",
            "source": "system"
        }

    if any(w in q_lower for w in ["contractor", "builder", "vendor"]):
        return {
            "answer": f"**Contractor Database:**\n\n"
                      f"- Active contractors: **{contractors_total}**\n\n"
                      f"View the Contractors page to manage your builder network, "
                      f"including specialties, licenses, ratings, and bid history.",
            "source": "system"
        }

    if any(w in q_lower for w in ["bid", "comparison", "award"]):
        total_bids = db.query(models.Bid).count()
        awarded = db.query(models.Bid).filter(models.Bid.status == "Awarded").count()
        return {
            "answer": f"**Bidding Overview:**\n\n"
                      f"- Total bids: **{total_bids}**\n"
                      f"- Awarded: **{awarded}**\n\n"
                      f"ProTerra's controlled bidding ensures all contractors bid from "
                      f"identical plans for true apples-to-apples comparison.",
            "source": "system"
        }

    return {
        "answer": f"**ProTerra CRM Summary:**\n\n"
                  f"- Leads: **{leads_total}**\n"
                  f"- Projects: **{projects_total}**\n"
                  f"- Contractors: **{contractors_total}**\n\n"
                  f"I can help with lead management, project tracking, contractor database, "
                  f"and bid comparisons. Try asking about your lead pipeline, active projects, "
                  f"or bidding status!\n\n"
                  f"*Note: Connect an OpenAI API key for full AI-powered responses.*",
        "source": "system"
    }


@router.get("/suggestions")
def get_suggestions(db: Session = Depends(get_db)):
    """Get AI-powered suggestions based on current CRM state."""
    suggestions = []

    # Check for stale leads
    new_leads = db.query(models.Lead).filter(models.Lead.status == "New Lead").count()
    if new_leads > 0:
        suggestions.append({
            "type": "action",
            "priority": "high",
            "message": f"You have {new_leads} new lead(s) that need to be contacted.",
            "action": "Go to Leads"
        })

    # Check for open bid packages without enough bids
    open_packages = db.query(models.BidPackage).filter(models.BidPackage.status == "Open").all()
    for pkg in open_packages:
        bid_count = db.query(models.Bid).filter(
            models.Bid.package_id == pkg.package_id,
            models.Bid.status == "Submitted"
        ).count()
        if bid_count < 3:
            suggestions.append({
                "type": "info",
                "priority": "medium",
                "message": f"Bid package '{pkg.title}' only has {bid_count} submitted bid(s). "
                          f"Consider inviting more contractors for better comparison.",
                "action": "Go to Bidding"
            })

    # Check for projects stuck in review
    review_projects = db.query(models.Project).filter(
        models.Project.status == "Client Review"
    ).count()
    if review_projects > 0:
        suggestions.append({
            "type": "info",
            "priority": "medium",
            "message": f"{review_projects} project(s) awaiting client review. Follow up to keep momentum.",
            "action": "Go to Projects"
        })

    # Pipeline health
    total_projects = db.query(models.Project).count()
    if total_projects == 0:
        suggestions.append({
            "type": "tip",
            "priority": "low",
            "message": "No projects yet. Convert your leads to start building your pipeline!",
            "action": "Go to Leads"
        })

    return {"suggestions": suggestions}
