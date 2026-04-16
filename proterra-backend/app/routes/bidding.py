"""Bidding system endpoints."""
from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from .automations import execute_automations

router = APIRouter(prefix="/api/bidding", tags=["Bidding"])


class BidPackageCreate(BaseModel):
    project_id: str
    title: str
    scope_of_work: str = ""
    material_specs: str = ""
    site_conditions: str = ""
    timeline_requirements: str = ""
    deadline: Optional[str] = None


class BidPackageUpdate(BaseModel):
    title: Optional[str] = None
    scope_of_work: Optional[str] = None
    material_specs: Optional[str] = None
    site_conditions: Optional[str] = None
    timeline_requirements: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None


class BidCreate(BaseModel):
    package_id: str
    contractor_id: str
    total_price: float = 0.0
    materials_cost: float = 0.0
    labor_cost: float = 0.0
    equipment_cost: float = 0.0
    permit_cost: float = 0.0
    proposed_timeline: str = ""
    warranty_terms: str = ""
    notes: str = ""


class BidUpdate(BaseModel):
    total_price: Optional[float] = None
    materials_cost: Optional[float] = None
    labor_cost: Optional[float] = None
    equipment_cost: Optional[float] = None
    permit_cost: Optional[float] = None
    proposed_timeline: Optional[str] = None
    warranty_terms: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class InviteContractors(BaseModel):
    contractor_ids: list[str]


def _parse_date(d: Optional[str]) -> Optional[date]:
    if not d:
        return None
    try:
        return date.fromisoformat(d)
    except (ValueError, TypeError):
        return None


# ── Bid Packages ───────────────────────────────────────────────────
@router.get("/packages")
def list_bid_packages(project_id: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.BidPackage)
    if project_id:
        q = q.filter(models.BidPackage.project_id == project_id)
    return q.order_by(models.BidPackage.created_at.desc()).all()


@router.get("/packages/{package_id}")
def get_bid_package(package_id: str, db: Session = Depends(get_db)):
    bp = db.query(models.BidPackage).filter(models.BidPackage.package_id == package_id).first()
    if not bp:
        raise HTTPException(status_code=404, detail="Bid package not found")

    bids = []
    for bid in bp.bids:
        contractor = db.query(models.Contractor).filter(
            models.Contractor.contractor_id == bid.contractor_id
        ).first()
        bids.append({
            **{c.name: getattr(bid, c.name) for c in bid.__table__.columns},
            "contractor_name": contractor.company_name if contractor else "Unknown",
            "contractor_phone": contractor.phone if contractor else "",
            "contractor_email": contractor.email if contractor else "",
        })

    return {
        **{c.name: getattr(bp, c.name) for c in bp.__table__.columns},
        "bids": bids,
    }


@router.post("/packages")
def create_bid_package(data: BidPackageCreate, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.project_id == data.project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    bp = models.BidPackage(
        project_id=data.project_id,
        title=data.title,
        scope_of_work=data.scope_of_work,
        material_specs=data.material_specs,
        site_conditions=data.site_conditions,
        timeline_requirements=data.timeline_requirements,
        deadline=_parse_date(data.deadline),
    )
    db.add(bp)
    log = models.ActivityLog(
        entity_type="bid_package", entity_id=bp.package_id,
        action="created", details=f"Bid package: {data.title} for project {data.project_id}"
    )
    db.add(log)
    db.commit()
    db.refresh(bp)

    # Fire automations for bid_package_created
    try:
        execute_automations(db, "bid_package_created", "bid_package", bp.package_id, {
            "package_id": bp.package_id, "project_id": bp.project_id,
            "title": bp.title, "project_type": proj.project_type if proj else "",
        })
    except Exception:
        pass

    return bp


@router.put("/packages/{package_id}")
def update_bid_package(package_id: str, data: BidPackageUpdate, db: Session = Depends(get_db)):
    bp = db.query(models.BidPackage).filter(models.BidPackage.package_id == package_id).first()
    if not bp:
        raise HTTPException(status_code=404, detail="Bid package not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "deadline":
            setattr(bp, key, _parse_date(value))
        else:
            setattr(bp, key, value)
    db.commit()
    db.refresh(bp)
    return bp


@router.delete("/packages/{package_id}")
def delete_bid_package(package_id: str, db: Session = Depends(get_db)):
    bp = db.query(models.BidPackage).filter(models.BidPackage.package_id == package_id).first()
    if not bp:
        raise HTTPException(status_code=404, detail="Bid package not found")
    db.delete(bp)
    db.commit()
    return {"ok": True}


# ── Invite contractors to bid ──────────────────────────────────────
@router.post("/packages/{package_id}/invite")
def invite_contractors(package_id: str, data: InviteContractors, db: Session = Depends(get_db)):
    bp = db.query(models.BidPackage).filter(models.BidPackage.package_id == package_id).first()
    if not bp:
        raise HTTPException(status_code=404, detail="Bid package not found")

    created = []
    for cid in data.contractor_ids:
        con = db.query(models.Contractor).filter(models.Contractor.contractor_id == cid).first()
        if not con:
            continue
        # Check if already invited
        existing = db.query(models.Bid).filter(
            models.Bid.package_id == package_id,
            models.Bid.contractor_id == cid
        ).first()
        if existing:
            continue

        bid = models.Bid(
            package_id=package_id,
            contractor_id=cid,
            status="Invited",
        )
        db.add(bid)
        created.append(bid)

    if bp.status == "Draft":
        bp.status = "Open"

    db.commit()
    return {"invited": len(created)}


# ── Bids ───────────────────────────────────────────────────────────
@router.get("/bids")
def list_bids(
    package_id: Optional[str] = None,
    contractor_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Bid)
    if package_id:
        q = q.filter(models.Bid.package_id == package_id)
    if contractor_id:
        q = q.filter(models.Bid.contractor_id == contractor_id)
    return q.all()


@router.post("/bids")
def create_bid(data: BidCreate, db: Session = Depends(get_db)):
    bp = db.query(models.BidPackage).filter(models.BidPackage.package_id == data.package_id).first()
    if not bp:
        raise HTTPException(status_code=404, detail="Bid package not found")

    bid = models.Bid(
        package_id=data.package_id,
        contractor_id=data.contractor_id,
        total_price=data.total_price,
        materials_cost=data.materials_cost,
        labor_cost=data.labor_cost,
        equipment_cost=data.equipment_cost,
        permit_cost=data.permit_cost,
        proposed_timeline=data.proposed_timeline,
        warranty_terms=data.warranty_terms,
        notes=data.notes,
        status="Submitted",
        submitted_at=datetime.utcnow(),
    )
    db.add(bid)
    db.commit()
    db.refresh(bid)

    # Fire automations for bid_submitted
    try:
        execute_automations(db, "bid_submitted", "bid", bid.bid_id, {
            "package_id": bid.package_id, "contractor_id": bid.contractor_id,
            "total_price": str(bid.total_price), "status": bid.status,
        })
    except Exception:
        pass

    return bid


@router.put("/bids/{bid_id}")
def update_bid(bid_id: str, data: BidUpdate, db: Session = Depends(get_db)):
    bid = db.query(models.Bid).filter(models.Bid.bid_id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(bid, key, value)

    if "status" in update_data and update_data["status"] == "Submitted":
        bid.submitted_at = datetime.utcnow()

    db.commit()
    db.refresh(bid)
    return bid


@router.post("/bids/{bid_id}/award")
def award_bid(bid_id: str, db: Session = Depends(get_db)):
    """Award a bid and decline all others in the same package."""
    bid = db.query(models.Bid).filter(models.Bid.bid_id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    # Award this bid
    bid.status = "Awarded"

    # Decline all other bids in the same package
    other_bids = db.query(models.Bid).filter(
        models.Bid.package_id == bid.package_id,
        models.Bid.bid_id != bid_id
    ).all()
    for ob in other_bids:
        if ob.status not in ("Declined",):
            ob.status = "Declined"

    # Update package status
    bp = db.query(models.BidPackage).filter(models.BidPackage.package_id == bid.package_id).first()
    if bp:
        bp.status = "Awarded"

    # Update project status
    if bp:
        proj = db.query(models.Project).filter(models.Project.project_id == bp.project_id).first()
        if proj and proj.status == "Bidding Phase":
            proj.status = "Builder Selected"

    log = models.ActivityLog(
        entity_type="bid", entity_id=bid_id,
        action="awarded", details=f"Bid awarded to contractor {bid.contractor_id}"
    )
    db.add(log)

    db.commit()
    db.refresh(bid)

    # Fire automations for bid_awarded
    try:
        execute_automations(db, "bid_awarded", "bid", bid.bid_id, {
            "package_id": bid.package_id, "contractor_id": bid.contractor_id,
            "project_id": bp.project_id if bp else "",
            "total_price": str(bid.total_price),
        })
    except Exception:
        pass

    return bid


# ── Bid comparison ─────────────────────────────────────────────────
@router.get("/packages/{package_id}/compare")
def compare_bids(package_id: str, db: Session = Depends(get_db)):
    """Side-by-side bid comparison for a package."""
    bp = db.query(models.BidPackage).filter(models.BidPackage.package_id == package_id).first()
    if not bp:
        raise HTTPException(status_code=404, detail="Bid package not found")

    submitted_bids = db.query(models.Bid).filter(
        models.Bid.package_id == package_id,
        models.Bid.status.in_(["Submitted", "Under Review", "Awarded"])
    ).all()

    comparison = []
    for bid in submitted_bids:
        contractor = db.query(models.Contractor).filter(
            models.Contractor.contractor_id == bid.contractor_id
        ).first()
        comparison.append({
            "bid_id": bid.bid_id,
            "contractor_name": contractor.company_name if contractor else "Unknown",
            "contractor_rating": contractor.rating if contractor else 0,
            "total_price": bid.total_price,
            "materials_cost": bid.materials_cost,
            "labor_cost": bid.labor_cost,
            "equipment_cost": bid.equipment_cost,
            "permit_cost": bid.permit_cost,
            "proposed_timeline": bid.proposed_timeline,
            "warranty_terms": bid.warranty_terms,
            "notes": bid.notes,
            "status": bid.status,
            "submitted_at": bid.submitted_at,
        })

    # Sort by total price
    comparison.sort(key=lambda x: x["total_price"])

    return {
        "package": {c.name: getattr(bp, c.name) for c in bp.__table__.columns},
        "bids": comparison,
        "lowest_bid": comparison[0] if comparison else None,
        "highest_bid": comparison[-1] if comparison else None,
        "average_price": round(sum(b["total_price"] for b in comparison) / len(comparison), 2) if comparison else 0,
    }
