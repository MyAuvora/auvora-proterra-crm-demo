"""Invoicing & Payments endpoints."""
import json
from datetime import datetime, date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/invoicing", tags=["Invoicing"])


# ── Pydantic schemas ────────────────────────────────────────────────

class LineItemCreate(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0


class InvoiceCreate(BaseModel):
    project_id: str
    title: str
    description: str = ""
    tax_rate: float = 0.0
    due_date: Optional[str] = None
    notes: str = ""
    line_items: list[LineItemCreate] = []


class InvoiceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    tax_rate: Optional[float] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(BaseModel):
    invoice_id: str
    amount: float
    method: str = "check"
    notes: str = ""


class ScheduleCreate(BaseModel):
    project_id: str
    milestones: list[dict]  # [{milestone, percentage, amount, due_date?}]


def _next_invoice_number(db: Session) -> str:
    """Generate next invoice number like INV-001, INV-002, etc."""
    count = db.query(models.Invoice).count()
    return f"INV-{count + 1:03d}"


def _serialize_invoice(inv: models.Invoice, db: Session) -> dict:
    items = db.query(models.InvoiceLineItem).filter(
        models.InvoiceLineItem.invoice_id == inv.invoice_id
    ).order_by(models.InvoiceLineItem.sort_order).all()

    payments = db.query(models.Payment).filter(
        models.Payment.invoice_id == inv.invoice_id
    ).order_by(models.Payment.paid_at.desc()).all()

    total_paid = sum(p.amount for p in payments)

    proj = db.query(models.Project).filter(
        models.Project.project_id == inv.project_id
    ).first()

    return {
        "invoice_id": inv.invoice_id,
        "invoice_number": inv.invoice_number,
        "project_id": inv.project_id,
        "project_name": proj.client_name if proj else "",
        "project_type": proj.project_type if proj else "",
        "title": inv.title,
        "description": inv.description,
        "amount": inv.amount,
        "tax_rate": inv.tax_rate,
        "tax_amount": inv.tax_amount,
        "total": inv.total,
        "status": inv.status,
        "due_date": str(inv.due_date) if inv.due_date else None,
        "paid_at": inv.paid_at,
        "notes": inv.notes,
        "created_at": inv.created_at,
        "updated_at": inv.updated_at,
        "total_paid": total_paid,
        "balance_due": inv.total - total_paid,
        "line_items": [
            {
                "item_id": li.item_id,
                "description": li.description,
                "quantity": li.quantity,
                "unit_price": li.unit_price,
                "amount": li.amount,
            }
            for li in items
        ],
        "payments": [
            {
                "payment_id": p.payment_id,
                "amount": p.amount,
                "method": p.method,
                "notes": p.notes,
                "paid_at": p.paid_at,
            }
            for p in payments
        ],
    }


# ── Invoice CRUD ────────────────────────────────────────────────────

@router.get("/invoices")
def list_invoices(
    project_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List all invoices with optional filters."""
    q = db.query(models.Invoice).order_by(models.Invoice.created_at.desc())
    if project_id:
        q = q.filter(models.Invoice.project_id == project_id)
    if status:
        q = q.filter(models.Invoice.status == status)
    return [_serialize_invoice(inv, db) for inv in q.all()]


@router.get("/invoices/{invoice_id}")
def get_invoice(invoice_id: str, db: Session = Depends(get_db)):
    """Get a single invoice with line items and payments."""
    inv = db.query(models.Invoice).filter(
        models.Invoice.invoice_id == invoice_id
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return _serialize_invoice(inv, db)


@router.post("/invoices")
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db)):
    """Create a new invoice with line items."""
    proj = db.query(models.Project).filter(
        models.Project.project_id == data.project_id
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    # Calculate totals from line items
    subtotal = 0.0
    for li in data.line_items:
        subtotal += li.quantity * li.unit_price

    tax_amount = round(subtotal * (data.tax_rate / 100), 2)
    total = round(subtotal + tax_amount, 2)

    due = None
    if data.due_date:
        try:
            due = date.fromisoformat(data.due_date)
        except ValueError:
            pass

    inv = models.Invoice(
        project_id=data.project_id,
        invoice_number=_next_invoice_number(db),
        title=data.title,
        description=data.description,
        amount=subtotal,
        tax_rate=data.tax_rate,
        tax_amount=tax_amount,
        total=total,
        due_date=due,
        notes=data.notes,
    )
    db.add(inv)
    db.flush()

    for i, li in enumerate(data.line_items):
        item = models.InvoiceLineItem(
            invoice_id=inv.invoice_id,
            description=li.description,
            quantity=li.quantity,
            unit_price=li.unit_price,
            amount=round(li.quantity * li.unit_price, 2),
            sort_order=i,
        )
        db.add(item)

    # Log activity
    db.add(models.ActivityLog(
        entity_type="invoice",
        entity_id=inv.invoice_id,
        action="created",
        details=f"Invoice {inv.invoice_number} created for {proj.client_name}: ${total:,.2f}",
    ))

    db.commit()
    db.refresh(inv)
    return _serialize_invoice(inv, db)


@router.put("/invoices/{invoice_id}")
def update_invoice(invoice_id: str, data: InvoiceUpdate, db: Session = Depends(get_db)):
    """Update invoice metadata."""
    inv = db.query(models.Invoice).filter(
        models.Invoice.invoice_id == invoice_id
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    update_data = data.model_dump(exclude_unset=True)
    old_status = inv.status

    if "due_date" in update_data and update_data["due_date"]:
        try:
            update_data["due_date"] = date.fromisoformat(update_data["due_date"])
        except ValueError:
            del update_data["due_date"]

    for key, val in update_data.items():
        setattr(inv, key, val)

    if "tax_rate" in update_data:
        inv.tax_amount = round(inv.amount * (inv.tax_rate / 100), 2)
        inv.total = round(inv.amount + inv.tax_amount, 2)

    if "status" in update_data and update_data["status"] != old_status:
        if update_data["status"] == "Paid":
            inv.paid_at = datetime.utcnow()
        db.add(models.ActivityLog(
            entity_type="invoice",
            entity_id=inv.invoice_id,
            action="status_changed",
            details=f"Invoice {inv.invoice_number}: {old_status} → {inv.status}",
        ))

    db.commit()
    db.refresh(inv)
    return _serialize_invoice(inv, db)


@router.delete("/invoices/{invoice_id}")
def delete_invoice(invoice_id: str, db: Session = Depends(get_db)):
    """Delete an invoice."""
    inv = db.query(models.Invoice).filter(
        models.Invoice.invoice_id == invoice_id
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(inv)
    db.commit()
    return {"status": "deleted"}


# ── Payments ────────────────────────────────────────────────────────

@router.post("/payments")
def record_payment(data: PaymentCreate, db: Session = Depends(get_db)):
    """Record a payment against an invoice."""
    inv = db.query(models.Invoice).filter(
        models.Invoice.invoice_id == data.invoice_id
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    payment = models.Payment(
        invoice_id=data.invoice_id,
        amount=data.amount,
        method=data.method,
        notes=data.notes,
    )
    db.add(payment)

    # Check if fully paid
    existing_paid = sum(
        p.amount for p in db.query(models.Payment).filter(
            models.Payment.invoice_id == data.invoice_id
        ).all()
    )
    total_paid = existing_paid + data.amount
    if total_paid >= inv.total:
        inv.status = "Paid"
        inv.paid_at = datetime.utcnow()

    db.add(models.ActivityLog(
        entity_type="invoice",
        entity_id=inv.invoice_id,
        action="payment_received",
        details=f"Payment of ${data.amount:,.2f} via {data.method} on {inv.invoice_number}",
    ))

    db.commit()
    db.refresh(payment)
    return {
        "payment_id": payment.payment_id,
        "amount": payment.amount,
        "method": payment.method,
        "invoice_status": inv.status,
    }


# ── Payment Schedules ───────────────────────────────────────────────

@router.get("/schedules")
def list_schedules(
    project_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List payment schedules."""
    q = db.query(models.PaymentSchedule).order_by(
        models.PaymentSchedule.sort_order
    )
    if project_id:
        q = q.filter(models.PaymentSchedule.project_id == project_id)

    results = []
    for s in q.all():
        proj = db.query(models.Project).filter(
            models.Project.project_id == s.project_id
        ).first()
        results.append({
            "schedule_id": s.schedule_id,
            "project_id": s.project_id,
            "project_name": proj.client_name if proj else "",
            "milestone": s.milestone,
            "percentage": s.percentage,
            "amount": s.amount,
            "due_date": str(s.due_date) if s.due_date else None,
            "status": s.status,
            "invoice_id": s.invoice_id,
            "sort_order": s.sort_order,
        })
    return results


@router.post("/schedules")
def create_schedule(data: ScheduleCreate, db: Session = Depends(get_db)):
    """Create a payment schedule for a project (replaces existing)."""
    proj = db.query(models.Project).filter(
        models.Project.project_id == data.project_id
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    # Delete existing schedule for this project
    db.query(models.PaymentSchedule).filter(
        models.PaymentSchedule.project_id == data.project_id
    ).delete()

    created = []
    for i, m in enumerate(data.milestones):
        due = None
        if m.get("due_date"):
            try:
                due = date.fromisoformat(m["due_date"])
            except ValueError:
                pass

        sched = models.PaymentSchedule(
            project_id=data.project_id,
            milestone=m["milestone"],
            percentage=m.get("percentage", 0),
            amount=m.get("amount", 0),
            due_date=due,
            sort_order=i,
        )
        db.add(sched)
        created.append(sched)

    db.commit()
    return [
        {
            "schedule_id": s.schedule_id,
            "milestone": s.milestone,
            "percentage": s.percentage,
            "amount": s.amount,
            "due_date": str(s.due_date) if s.due_date else None,
            "status": s.status,
        }
        for s in created
    ]


# ── Summary ─────────────────────────────────────────────────────────

@router.get("/summary")
def invoicing_summary(db: Session = Depends(get_db)):
    """Get high-level invoicing summary stats."""
    invoices = db.query(models.Invoice).all()

    total_invoiced = sum(i.total for i in invoices)
    total_paid = 0.0
    for inv in invoices:
        payments = db.query(models.Payment).filter(
            models.Payment.invoice_id == inv.invoice_id
        ).all()
        total_paid += sum(p.amount for p in payments)

    by_status = {}
    for inv in invoices:
        by_status[inv.status] = by_status.get(inv.status, 0) + 1

    overdue_count = sum(
        1 for i in invoices
        if i.status in ("Sent", "Draft") and i.due_date and i.due_date < date.today()
    )

    return {
        "total_invoiced": round(total_invoiced, 2),
        "total_paid": round(total_paid, 2),
        "total_outstanding": round(total_invoiced - total_paid, 2),
        "invoice_count": len(invoices),
        "by_status": by_status,
        "overdue_count": overdue_count,
    }
