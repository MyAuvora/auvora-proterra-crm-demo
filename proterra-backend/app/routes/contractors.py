"""Contractor management endpoints."""
from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/contractors", tags=["Contractors"])


class ContractorCreate(BaseModel):
    company_name: str
    contact_name: str = ""
    email: str = ""
    phone: str = ""
    specialty: str = ""
    service_area: str = ""
    license_number: str = ""
    insurance_status: str = "Active"
    insurance_expiry: Optional[str] = None
    rating: float = 0.0
    notes: str = ""


class ContractorUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    service_area: Optional[str] = None
    license_number: Optional[str] = None
    insurance_status: Optional[str] = None
    insurance_expiry: Optional[str] = None
    rating: Optional[float] = None
    notes: Optional[str] = None
    active: Optional[bool] = None


@router.get("")
def list_contractors(
    specialty: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    q = db.query(models.Contractor)
    if active_only:
        q = q.filter(models.Contractor.active == True)
    if specialty:
        q = q.filter(models.Contractor.specialty == specialty)
    return q.order_by(models.Contractor.company_name).all()


@router.get("/{contractor_id}")
def get_contractor(contractor_id: str, db: Session = Depends(get_db)):
    con = db.query(models.Contractor).filter(models.Contractor.contractor_id == contractor_id).first()
    if not con:
        raise HTTPException(status_code=404, detail="Contractor not found")

    # Include bid history
    bids = db.query(models.Bid).filter(models.Bid.contractor_id == contractor_id).all()
    total_bids = len(bids)
    won_bids = sum(1 for b in bids if b.status == "Awarded")

    return {
        **{c.name: getattr(con, c.name) for c in con.__table__.columns},
        "total_bids": total_bids,
        "won_bids": won_bids,
        "win_rate": round(won_bids / total_bids * 100, 1) if total_bids > 0 else 0,
    }


@router.post("")
def create_contractor(data: ContractorCreate, db: Session = Depends(get_db)):
    expiry = None
    if data.insurance_expiry:
        try:
            expiry = date.fromisoformat(data.insurance_expiry)
        except (ValueError, TypeError):
            pass

    con = models.Contractor(
        company_name=data.company_name,
        contact_name=data.contact_name,
        email=data.email,
        phone=data.phone,
        specialty=data.specialty,
        service_area=data.service_area,
        license_number=data.license_number,
        insurance_status=data.insurance_status,
        insurance_expiry=expiry,
        rating=data.rating,
        notes=data.notes,
    )
    db.add(con)
    db.flush()
    log = models.ActivityLog(
        entity_type="contractor", entity_id=con.contractor_id,
        action="created", details=f"New contractor: {data.company_name}"
    )
    db.add(log)
    db.commit()
    db.refresh(con)
    return con


@router.put("/{contractor_id}")
def update_contractor(contractor_id: str, data: ContractorUpdate, db: Session = Depends(get_db)):
    con = db.query(models.Contractor).filter(models.Contractor.contractor_id == contractor_id).first()
    if not con:
        raise HTTPException(status_code=404, detail="Contractor not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "insurance_expiry":
            try:
                setattr(con, key, date.fromisoformat(value) if value else None)
            except (ValueError, TypeError):
                pass
        else:
            setattr(con, key, value)
    con.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(con)
    return con


@router.delete("/{contractor_id}")
def delete_contractor(contractor_id: str, db: Session = Depends(get_db)):
    con = db.query(models.Contractor).filter(models.Contractor.contractor_id == contractor_id).first()
    if not con:
        raise HTTPException(status_code=404, detail="Contractor not found")
    db.delete(con)
    db.commit()
    return {"ok": True}
