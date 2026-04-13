"""Project management endpoints."""
from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/projects", tags=["Projects"])


class ProjectCreate(BaseModel):
    client_name: str
    client_email: str = ""
    client_phone: str = ""
    property_address: str = ""
    project_type: str = ""
    description: str = ""
    budget_estimate: float = 0.0
    start_date: Optional[str] = None
    target_completion: Optional[str] = None
    notes: str = ""


class ProjectUpdate(BaseModel):
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    property_address: Optional[str] = None
    project_type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    budget_estimate: Optional[float] = None
    actual_cost: Optional[float] = None
    start_date: Optional[str] = None
    target_completion: Optional[str] = None
    notes: Optional[str] = None


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    priority: str = "medium"
    due_date: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None


def _parse_date(d: Optional[str]) -> Optional[date]:
    if not d:
        return None
    try:
        return date.fromisoformat(d)
    except (ValueError, TypeError):
        return None


@router.get("")
def list_projects(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.Project)
    if status:
        q = q.filter(models.Project.status == status)
    return q.order_by(models.Project.created_at.desc()).all()


@router.get("/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        **{c.name: getattr(proj, c.name) for c in proj.__table__.columns},
        "tasks": [
            {c.name: getattr(t, c.name) for c in t.__table__.columns}
            for t in sorted(proj.tasks, key=lambda t: t.sort_order)
        ],
        "bid_packages": [
            {c.name: getattr(bp, c.name) for c in bp.__table__.columns}
            for bp in proj.bid_packages
        ],
        "files": [
            {c.name: getattr(f, c.name) for c in f.__table__.columns}
            for f in proj.files
        ],
    }


@router.post("")
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    proj = models.Project(
        client_name=data.client_name,
        client_email=data.client_email,
        client_phone=data.client_phone,
        property_address=data.property_address,
        project_type=data.project_type,
        description=data.description,
        budget_estimate=data.budget_estimate,
        start_date=_parse_date(data.start_date),
        target_completion=_parse_date(data.target_completion),
        notes=data.notes,
    )
    db.add(proj)
    db.flush()

    # Default task checklist
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
        task = models.Task(project_id=proj.project_id, title=title, sort_order=i)
        db.add(task)

    log = models.ActivityLog(
        entity_type="project", entity_id=proj.project_id,
        action="created", details=f"New project: {data.client_name}"
    )
    db.add(log)
    db.commit()
    db.refresh(proj)
    return proj


@router.put("/{project_id}")
def update_project(project_id: str, data: ProjectUpdate, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = data.model_dump(exclude_unset=True)
    old_status = proj.status
    for key, value in update_data.items():
        if key in ("start_date", "target_completion"):
            setattr(proj, key, _parse_date(value))
        else:
            setattr(proj, key, value)
    proj.updated_at = datetime.utcnow()

    if "status" in update_data and update_data["status"] != old_status:
        log = models.ActivityLog(
            entity_type="project", entity_id=project_id,
            action="status_changed",
            details=f"Status: {old_status} -> {update_data['status']}"
        )
        db.add(log)

    db.commit()
    db.refresh(proj)
    return proj


@router.delete("/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(proj)
    db.commit()
    return {"ok": True}


# ── Tasks ──────────────────────────────────────────────────────────
@router.get("/{project_id}/tasks")
def list_tasks(project_id: str, db: Session = Depends(get_db)):
    return (
        db.query(models.Task)
        .filter(models.Task.project_id == project_id)
        .order_by(models.Task.sort_order)
        .all()
    )


@router.post("/{project_id}/tasks")
def create_task(project_id: str, data: TaskCreate, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    max_order = db.query(models.Task).filter(
        models.Task.project_id == project_id
    ).count()

    task = models.Task(
        project_id=project_id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        due_date=_parse_date(data.due_date),
        sort_order=max_order,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{project_id}/tasks/{task_id}")
def update_task(project_id: str, task_id: str, data: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(
        models.Task.task_id == task_id,
        models.Task.project_id == project_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "due_date":
            setattr(task, key, _parse_date(value))
        elif key == "status" and value == "completed" and task.status != "completed":
            task.status = "completed"
            task.completed_at = datetime.utcnow()
        else:
            setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{project_id}/tasks/{task_id}")
def delete_task(project_id: str, task_id: str, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(
        models.Task.task_id == task_id,
        models.Task.project_id == project_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"ok": True}
