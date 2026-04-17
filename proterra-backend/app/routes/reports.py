"""Reporting & Analytics endpoints."""
from datetime import datetime, timedelta, date
from collections import defaultdict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/revenue-pipeline")
def revenue_pipeline(db: Session = Depends(get_db)):
    """Revenue pipeline: leads → projects → completed with dollar values at each stage."""
    # Lead stage values (use budget_range midpoint estimates)
    leads = db.query(models.Lead).all()
    lead_pipeline = defaultdict(lambda: {"count": 0, "value": 0.0})
    for lead in leads:
        val = _estimate_budget(lead.budget_range)
        lead_pipeline[lead.status]["count"] += 1
        lead_pipeline[lead.status]["value"] += val

    # Project stage values
    projects = db.query(models.Project).all()
    project_pipeline = defaultdict(lambda: {"count": 0, "value": 0.0})
    for proj in projects:
        project_pipeline[proj.status]["count"] += 1
        project_pipeline[proj.status]["value"] += proj.budget_estimate or 0

    # Funnel summary
    total_lead_value = sum(d["value"] for d in lead_pipeline.values())
    signed_value = lead_pipeline.get("Signed", {}).get("value", 0)
    active_project_value = sum(
        d["value"] for k, d in project_pipeline.items()
        if k not in ("Completed", "Cancelled")
    )
    completed_value = sum(
        p.actual_cost or p.budget_estimate or 0
        for p in projects if p.status == "Completed"
    )

    return {
        "lead_stages": dict(lead_pipeline),
        "project_stages": dict(project_pipeline),
        "funnel": [
            {"stage": "All Leads", "count": len(leads), "value": round(total_lead_value, 2)},
            {"stage": "Signed", "count": lead_pipeline.get("Signed", {}).get("count", 0), "value": round(signed_value, 2)},
            {"stage": "Active Projects", "count": sum(1 for p in projects if p.status not in ("Completed", "Cancelled")), "value": round(active_project_value, 2)},
            {"stage": "Completed", "count": sum(1 for p in projects if p.status == "Completed"), "value": round(completed_value, 2)},
        ],
    }


@router.get("/lead-conversion")
def lead_conversion(db: Session = Depends(get_db)):
    """Lead conversion analytics: by source, by type, time trends."""
    leads = db.query(models.Lead).all()

    # By source
    by_source = defaultdict(lambda: {"total": 0, "signed": 0, "lost": 0})
    for lead in leads:
        src = lead.source or "unknown"
        by_source[src]["total"] += 1
        if lead.status == "Signed":
            by_source[src]["signed"] += 1
        elif lead.status == "Lost":
            by_source[src]["lost"] += 1

    source_rates = []
    for src, data in by_source.items():
        rate = round(data["signed"] / data["total"] * 100, 1) if data["total"] > 0 else 0
        source_rates.append({
            "source": src,
            "total": data["total"],
            "signed": data["signed"],
            "lost": data["lost"],
            "conversion_rate": rate,
        })
    source_rates.sort(key=lambda x: x["conversion_rate"], reverse=True)

    # By project type
    by_type = defaultdict(lambda: {"total": 0, "signed": 0, "avg_value": 0.0, "values": []})
    for lead in leads:
        pt = lead.project_type or "Other"
        by_type[pt]["total"] += 1
        val = _estimate_budget(lead.budget_range)
        by_type[pt]["values"].append(val)
        if lead.status == "Signed":
            by_type[pt]["signed"] += 1

    type_stats = []
    for pt, data in by_type.items():
        avg = round(sum(data["values"]) / len(data["values"]), 2) if data["values"] else 0
        rate = round(data["signed"] / data["total"] * 100, 1) if data["total"] > 0 else 0
        type_stats.append({
            "project_type": pt,
            "total": data["total"],
            "signed": data["signed"],
            "conversion_rate": rate,
            "avg_value": avg,
        })
    type_stats.sort(key=lambda x: x["total"], reverse=True)

    # Monthly trend (last 6 months)
    now = datetime.utcnow()
    monthly = []
    for i in range(5, -1, -1):
        month_start = (now - timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i > 0:
            month_end = (now - timedelta(days=30 * (i - 1))).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            month_end = now
        month_leads = [l for l in leads if month_start <= (l.created_at or now) < month_end]
        signed = sum(1 for l in month_leads if l.status == "Signed")
        monthly.append({
            "month": month_start.strftime("%b %Y"),
            "leads": len(month_leads),
            "signed": signed,
            "conversion_rate": round(signed / len(month_leads) * 100, 1) if month_leads else 0,
        })

    overall_rate = round(
        sum(1 for l in leads if l.status == "Signed") / len(leads) * 100, 1
    ) if leads else 0

    return {
        "overall_conversion_rate": overall_rate,
        "total_leads": len(leads),
        "total_signed": sum(1 for l in leads if l.status == "Signed"),
        "by_source": source_rates,
        "by_type": type_stats,
        "monthly_trend": monthly,
    }


@router.get("/contractor-scorecards")
def contractor_scorecards(db: Session = Depends(get_db)):
    """Contractor performance scorecards."""
    contractors = db.query(models.Contractor).filter(
        models.Contractor.active == True
    ).all()

    scorecards = []
    for con in contractors:
        bids = db.query(models.Bid).filter(
            models.Bid.contractor_id == con.contractor_id
        ).all()

        total_bids = len(bids)
        awarded = sum(1 for b in bids if b.status == "Awarded")
        submitted = sum(1 for b in bids if b.status in ("Submitted", "Awarded", "Under Review"))
        win_rate = round(awarded / submitted * 100, 1) if submitted > 0 else 0

        avg_bid = round(
            sum(b.total_price for b in bids if b.total_price > 0) / total_bids, 2
        ) if total_bids > 0 else 0

        total_awarded_value = sum(b.total_price for b in bids if b.status == "Awarded")

        # Insurance status
        insurance_ok = con.insurance_status == "Active"
        days_until_expiry = None
        if con.insurance_expiry:
            days_until_expiry = (con.insurance_expiry - date.today()).days

        scorecards.append({
            "contractor_id": con.contractor_id,
            "company_name": con.company_name,
            "contact_name": con.contact_name,
            "specialty": con.specialty,
            "rating": con.rating,
            "total_bids": total_bids,
            "bids_awarded": awarded,
            "win_rate": win_rate,
            "avg_bid_amount": avg_bid,
            "total_awarded_value": round(total_awarded_value, 2),
            "insurance_status": con.insurance_status,
            "insurance_ok": insurance_ok,
            "days_until_insurance_expiry": days_until_expiry,
        })

    scorecards.sort(key=lambda x: x["rating"], reverse=True)
    return {"contractors": scorecards}


@router.get("/profit-tracking")
def profit_tracking(db: Session = Depends(get_db)):
    """Project profit/margin tracking."""
    projects = db.query(models.Project).all()

    tracking = []
    for proj in projects:
        budget = proj.budget_estimate or 0
        actual = proj.actual_cost or 0
        variance = budget - actual if actual > 0 else 0
        margin_pct = round(variance / budget * 100, 1) if budget > 0 and actual > 0 else 0

        # Get invoice data
        invoices = db.query(models.Invoice).filter(
            models.Invoice.project_id == proj.project_id
        ).all()
        total_invoiced = sum(i.total for i in invoices)
        total_paid = 0.0
        for inv in invoices:
            payments = db.query(models.Payment).filter(
                models.Payment.invoice_id == inv.invoice_id
            ).all()
            total_paid += sum(p.amount for p in payments)

        tracking.append({
            "project_id": proj.project_id,
            "client_name": proj.client_name,
            "project_type": proj.project_type,
            "status": proj.status,
            "budget_estimate": budget,
            "actual_cost": actual,
            "variance": round(variance, 2),
            "margin_percent": margin_pct,
            "total_invoiced": round(total_invoiced, 2),
            "total_paid": round(total_paid, 2),
            "over_budget": actual > budget if actual > 0 and budget > 0 else False,
        })

    total_budget = sum(t["budget_estimate"] for t in tracking)
    total_actual = sum(t["actual_cost"] for t in tracking if t["actual_cost"] > 0)
    total_invoiced = sum(t["total_invoiced"] for t in tracking)
    total_collected = sum(t["total_paid"] for t in tracking)

    return {
        "projects": tracking,
        "summary": {
            "total_budget": round(total_budget, 2),
            "total_actual_cost": round(total_actual, 2),
            "total_invoiced": round(total_invoiced, 2),
            "total_collected": round(total_collected, 2),
            "overall_margin": round(
                (total_budget - total_actual) / total_budget * 100, 1
            ) if total_budget > 0 and total_actual > 0 else 0,
            "projects_over_budget": sum(1 for t in tracking if t["over_budget"]),
        },
    }


@router.get("/monthly-summary")
def monthly_summary(db: Session = Depends(get_db)):
    """Monthly business summary for the last 6 months."""
    now = datetime.utcnow()
    months = []

    for i in range(5, -1, -1):
        month_start = (now - timedelta(days=30 * i)).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        if i > 0:
            month_end = (now - timedelta(days=30 * (i - 1))).replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
        else:
            month_end = now

        new_leads = db.query(models.Lead).filter(
            models.Lead.created_at >= month_start,
            models.Lead.created_at < month_end,
        ).count()

        new_projects = db.query(models.Project).filter(
            models.Project.created_at >= month_start,
            models.Project.created_at < month_end,
        ).count()

        invoices = db.query(models.Invoice).filter(
            models.Invoice.created_at >= month_start,
            models.Invoice.created_at < month_end,
        ).all()
        revenue = sum(i.total for i in invoices)

        payments = db.query(models.Payment).filter(
            models.Payment.paid_at >= month_start,
            models.Payment.paid_at < month_end,
        ).all()
        collected = sum(p.amount for p in payments)

        months.append({
            "month": month_start.strftime("%b %Y"),
            "new_leads": new_leads,
            "new_projects": new_projects,
            "invoiced": round(revenue, 2),
            "collected": round(collected, 2),
        })

    return {"months": months}


# ── Helpers ──────────────────────────────────────────────────────────

def _estimate_budget(budget_range: str) -> float:
    """Estimate a numeric value from a budget range string like '$80,000 - $120,000'."""
    if not budget_range:
        return 0.0
    try:
        parts = budget_range.replace("$", "").replace(",", "").split("-")
        nums = [float(p.strip()) for p in parts if p.strip()]
        if len(nums) == 2:
            return (nums[0] + nums[1]) / 2
        elif len(nums) == 1:
            return nums[0]
    except (ValueError, IndexError):
        pass
    return 0.0
