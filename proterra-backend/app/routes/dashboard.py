"""Dashboard analytics endpoints."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("")
def get_dashboard(db: Session = Depends(get_db)):
    """Main dashboard with all key metrics."""
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    ninety_days_ago = now - timedelta(days=90)

    # Lead metrics
    total_leads = db.query(models.Lead).count()
    new_leads_30d = db.query(models.Lead).filter(models.Lead.created_at >= thirty_days_ago).count()
    leads_by_status = {}
    for row in db.query(models.Lead.status, func.count(models.Lead.lead_id)).group_by(models.Lead.status).all():
        leads_by_status[row[0]] = row[1]

    leads_by_source = {}
    for row in db.query(models.Lead.source, func.count(models.Lead.lead_id)).group_by(models.Lead.source).all():
        leads_by_source[row[0]] = row[1]

    signed_leads = db.query(models.Lead).filter(models.Lead.status == "Signed").count()
    conversion_rate = round(signed_leads / total_leads * 100, 1) if total_leads > 0 else 0

    # Project metrics
    total_projects = db.query(models.Project).count()
    active_projects = db.query(models.Project).filter(
        models.Project.status.notin_(["Complete", "Cancelled"])
    ).count()
    projects_by_status = {}
    for row in db.query(models.Project.status, func.count(models.Project.project_id)).group_by(models.Project.status).all():
        projects_by_status[row[0]] = row[1]

    total_budget = db.query(func.sum(models.Project.budget_estimate)).scalar() or 0
    avg_budget = db.query(func.avg(models.Project.budget_estimate)).filter(
        models.Project.budget_estimate > 0
    ).scalar() or 0

    # Contractor metrics
    total_contractors = db.query(models.Contractor).filter(models.Contractor.active == True).count()

    # Bidding metrics
    total_bids = db.query(models.Bid).count()
    submitted_bids = db.query(models.Bid).filter(models.Bid.status == "Submitted").count()
    awarded_bids = db.query(models.Bid).filter(models.Bid.status == "Awarded").count()
    open_packages = db.query(models.BidPackage).filter(models.BidPackage.status == "Open").count()

    # Recent activity
    recent_activity = (
        db.query(models.ActivityLog)
        .order_by(models.ActivityLog.created_at.desc())
        .limit(20)
        .all()
    )

    return {
        "leads": {
            "total": total_leads,
            "new_30d": new_leads_30d,
            "by_status": leads_by_status,
            "by_source": leads_by_source,
            "conversion_rate": conversion_rate,
        },
        "projects": {
            "total": total_projects,
            "active": active_projects,
            "by_status": projects_by_status,
            "total_pipeline_value": round(total_budget, 2),
            "avg_project_value": round(avg_budget, 2),
        },
        "contractors": {
            "total_active": total_contractors,
        },
        "bidding": {
            "total_bids": total_bids,
            "submitted": submitted_bids,
            "awarded": awarded_bids,
            "open_packages": open_packages,
        },
        "recent_activity": [
            {
                "log_id": a.log_id,
                "entity_type": a.entity_type,
                "entity_id": a.entity_id,
                "action": a.action,
                "details": a.details,
                "created_at": a.created_at,
            }
            for a in recent_activity
        ],
    }
