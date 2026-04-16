"""Client Portal — public-facing endpoints for clients to view their project."""
import secrets
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/client-portal", tags=["Client Portal"])


# ── Admin endpoints (manage portal access) ──────────────────────────

class CreatePortalAccess(BaseModel):
    project_id: str
    client_name: str
    client_email: str = ""


class DesignApprovalCreate(BaseModel):
    project_id: str
    title: str
    description: str = ""


class DesignApprovalResponse(BaseModel):
    status: str  # "Approved" or "Revision Requested"
    client_notes: str = ""


@router.get("/access")
def list_portal_access(db: Session = Depends(get_db)):
    """List all client portal access links."""
    items = db.query(models.ClientPortalAccess).order_by(
        models.ClientPortalAccess.created_at.desc()
    ).all()
    return [
        {
            "access_id": a.access_id,
            "project_id": a.project_id,
            "access_token": a.access_token,
            "client_name": a.client_name,
            "client_email": a.client_email,
            "is_active": a.is_active,
            "last_accessed_at": a.last_accessed_at,
            "created_at": a.created_at,
        }
        for a in items
    ]


@router.post("/access")
def create_portal_access(data: CreatePortalAccess, db: Session = Depends(get_db)):
    """Generate a unique portal access link for a client."""
    proj = db.query(models.Project).filter(
        models.Project.project_id == data.project_id
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    token = secrets.token_urlsafe(32)
    access = models.ClientPortalAccess(
        project_id=data.project_id,
        access_token=token,
        client_name=data.client_name,
        client_email=data.client_email,
    )
    db.add(access)
    db.commit()
    db.refresh(access)
    return {
        "access_id": access.access_id,
        "access_token": access.access_token,
        "client_name": access.client_name,
        "project_id": access.project_id,
        "is_active": access.is_active,
    }


@router.delete("/access/{access_id}")
def revoke_portal_access(access_id: str, db: Session = Depends(get_db)):
    """Revoke a client portal access link."""
    access = db.query(models.ClientPortalAccess).filter(
        models.ClientPortalAccess.access_id == access_id
    ).first()
    if not access:
        raise HTTPException(status_code=404, detail="Access not found")
    access.is_active = False
    db.commit()
    return {"status": "revoked"}


@router.post("/access/{access_id}/toggle")
def toggle_portal_access(access_id: str, db: Session = Depends(get_db)):
    """Toggle active/inactive for a portal access link."""
    access = db.query(models.ClientPortalAccess).filter(
        models.ClientPortalAccess.access_id == access_id
    ).first()
    if not access:
        raise HTTPException(status_code=404, detail="Access not found")
    access.is_active = not access.is_active
    db.commit()
    return {"is_active": access.is_active}


# ── Design Approvals (admin) ────────────────────────────────────────

@router.get("/approvals")
def list_approvals(
    project_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List all design approvals, optionally filtered by project."""
    q = db.query(models.DesignApproval).order_by(
        models.DesignApproval.created_at.desc()
    )
    if project_id:
        q = q.filter(models.DesignApproval.project_id == project_id)
    return [
        {
            "approval_id": a.approval_id,
            "project_id": a.project_id,
            "title": a.title,
            "description": a.description,
            "status": a.status,
            "client_notes": a.client_notes,
            "created_at": a.created_at,
            "responded_at": a.responded_at,
        }
        for a in q.all()
    ]


@router.post("/approvals")
def create_approval(data: DesignApprovalCreate, db: Session = Depends(get_db)):
    """Create a new design approval request for a project."""
    proj = db.query(models.Project).filter(
        models.Project.project_id == data.project_id
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    approval = models.DesignApproval(
        project_id=data.project_id,
        title=data.title,
        description=data.description,
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)
    return {
        "approval_id": approval.approval_id,
        "title": approval.title,
        "status": approval.status,
    }


@router.delete("/approvals/{approval_id}")
def delete_approval(approval_id: str, db: Session = Depends(get_db)):
    """Delete a design approval."""
    approval = db.query(models.DesignApproval).filter(
        models.DesignApproval.approval_id == approval_id
    ).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    db.delete(approval)
    db.commit()
    return {"status": "deleted"}


# ── Public client-facing endpoints (token-based auth) ────────────────

def _get_access(token: str, db: Session) -> models.ClientPortalAccess:
    """Validate token and return access record."""
    access = db.query(models.ClientPortalAccess).filter(
        models.ClientPortalAccess.access_token == token,
        models.ClientPortalAccess.is_active == True,
    ).first()
    if not access:
        raise HTTPException(status_code=403, detail="Invalid or expired access link")
    access.last_accessed_at = datetime.utcnow()
    db.commit()
    return access


@router.get("/view/{token}")
def client_view_project(token: str, db: Session = Depends(get_db)):
    """Client-facing: View project details via access token."""
    access = _get_access(token, db)
    proj = db.query(models.Project).filter(
        models.Project.project_id == access.project_id
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    tasks = db.query(models.Task).filter(
        models.Task.project_id == proj.project_id
    ).order_by(models.Task.sort_order).all()

    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == "completed")
    progress = round(completed_tasks / total_tasks * 100) if total_tasks > 0 else 0

    files = db.query(models.ProjectFile).filter(
        models.ProjectFile.project_id == proj.project_id
    ).order_by(models.ProjectFile.uploaded_at.desc()).all()

    approvals = db.query(models.DesignApproval).filter(
        models.DesignApproval.project_id == proj.project_id
    ).order_by(models.DesignApproval.created_at.desc()).all()

    # Get invoices for this project
    invoices = db.query(models.Invoice).filter(
        models.Invoice.project_id == proj.project_id
    ).order_by(models.Invoice.created_at.desc()).all()

    return {
        "client_name": access.client_name,
        "project": {
            "project_id": proj.project_id,
            "project_type": proj.project_type,
            "description": proj.description,
            "status": proj.status,
            "property_address": proj.property_address,
            "start_date": str(proj.start_date) if proj.start_date else None,
            "target_completion": str(proj.target_completion) if proj.target_completion else None,
            "budget_estimate": proj.budget_estimate,
            "progress": progress,
        },
        "milestones": [
            {
                "task_id": t.task_id,
                "title": t.title,
                "status": t.status,
                "due_date": str(t.due_date) if t.due_date else None,
            }
            for t in tasks
        ],
        "files": [
            {
                "file_id": f.file_id,
                "filename": f.filename,
                "file_type": f.file_type,
                "uploaded_at": f.uploaded_at,
            }
            for f in files
        ],
        "approvals": [
            {
                "approval_id": a.approval_id,
                "title": a.title,
                "description": a.description,
                "status": a.status,
                "client_notes": a.client_notes,
                "created_at": a.created_at,
                "responded_at": a.responded_at,
            }
            for a in approvals
        ],
        "invoices": [
            {
                "invoice_id": inv.invoice_id,
                "invoice_number": inv.invoice_number,
                "title": inv.title,
                "total": inv.total,
                "status": inv.status,
                "due_date": str(inv.due_date) if inv.due_date else None,
            }
            for inv in invoices
        ],
    }


@router.post("/view/{token}/approve/{approval_id}")
def client_respond_approval(
    token: str,
    approval_id: str,
    data: DesignApprovalResponse,
    db: Session = Depends(get_db),
):
    """Client-facing: Approve or request revision on a design."""
    access = _get_access(token, db)
    approval = db.query(models.DesignApproval).filter(
        models.DesignApproval.approval_id == approval_id,
        models.DesignApproval.project_id == access.project_id,
    ).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")

    if data.status not in ("Approved", "Revision Requested"):
        raise HTTPException(status_code=400, detail="Status must be 'Approved' or 'Revision Requested'")

    approval.status = data.status
    approval.client_notes = data.client_notes
    approval.responded_at = datetime.utcnow()
    db.commit()

    # Log activity
    db.add(models.ActivityLog(
        entity_type="project",
        entity_id=access.project_id,
        action="design_response",
        details=f"Client {data.status.lower()} design: {approval.title}. Notes: {data.client_notes}",
    ))
    db.commit()

    return {"status": approval.status, "responded_at": approval.responded_at}
