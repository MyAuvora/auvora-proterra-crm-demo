"""Document upload/download/delete endpoints for ProTerra CRM."""
import os
import re
import shutil
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Document

router = APIRouter(prefix="/api/documents", tags=["documents"])

# Store uploads in a persistent directory (Fly.io volume at /data, or local ./uploads)
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/data/uploads" if os.path.isdir("/data") else "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_CATEGORIES = [
    "contract", "quote", "design", "photo", "survey",
    "permit", "insurance", "render", "blueprint", "other",
]

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

# Only allow safe characters in entity IDs to prevent path traversal
SAFE_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_\-]+$")


def _validate_entity_id(entity_id: str) -> None:
    """Reject entity_id values that could cause path traversal."""
    if not SAFE_ID_PATTERN.match(entity_id):
        raise HTTPException(status_code=400, detail="Invalid entity_id")


def _safe_file_path(entity_type: str, entity_id: str, filename: str) -> str:
    """Build a file path and verify it stays within UPLOAD_DIR."""
    path = os.path.join(UPLOAD_DIR, entity_type, entity_id, filename)
    real = os.path.realpath(path)
    if not real.startswith(os.path.realpath(UPLOAD_DIR)):
        raise HTTPException(status_code=400, detail="Invalid file path")
    return real


@router.get("")
def list_documents(
    entity_type: str = Query(..., description="lead, project, or contractor"),
    entity_id: str = Query(..., description="Entity ID"),
    category: str | None = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
):
    """List all documents for a given entity."""
    q = db.query(Document).filter(
        Document.entity_type == entity_type,
        Document.entity_id == entity_id,
    )
    if category:
        q = q.filter(Document.category == category)
    docs = q.order_by(Document.uploaded_at.desc()).all()
    return [
        {
            "document_id": d.document_id,
            "entity_type": d.entity_type,
            "entity_id": d.entity_id,
            "filename": d.filename,
            "original_filename": d.original_filename,
            "content_type": d.content_type,
            "file_size": d.file_size,
            "category": d.category,
            "description": d.description,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
        }
        for d in docs
    ]


@router.post("")
async def upload_document(
    file: UploadFile = File(...),
    entity_type: str = Form(...),
    entity_id: str = Form(...),
    category: str = Form("other"),
    description: str = Form(""),
    db: Session = Depends(get_db),
):
    """Upload a document and attach it to an entity."""
    if entity_type not in ("lead", "project", "contractor"):
        raise HTTPException(status_code=400, detail="entity_type must be lead, project, or contractor")
    _validate_entity_id(entity_id)
    if category not in ALLOWED_CATEGORIES:
        category = "other"

    # Read file content
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 50 MB)")

    # Generate unique filename to avoid collisions
    ext = os.path.splitext(file.filename or "file")[1]
    unique_name = f"{uuid.uuid4().hex[:16]}{ext}"

    # Save to disk (path-safe)
    file_path = _safe_file_path(entity_type, entity_id, unique_name)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(content)

    # Create DB record
    doc = Document(
        entity_type=entity_type,
        entity_id=entity_id,
        filename=unique_name,
        original_filename=file.filename or "unknown",
        content_type=file.content_type or "",
        file_size=len(content),
        category=category,
        description=description,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "document_id": doc.document_id,
        "entity_type": doc.entity_type,
        "entity_id": doc.entity_id,
        "filename": doc.filename,
        "original_filename": doc.original_filename,
        "content_type": doc.content_type,
        "file_size": doc.file_size,
        "category": doc.category,
        "description": doc.description,
        "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
    }


@router.get("/{document_id}/download")
def download_document(document_id: str, db: Session = Depends(get_db)):
    """Download a document by ID."""
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = _safe_file_path(doc.entity_type, doc.entity_id, doc.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=file_path,
        filename=doc.original_filename,
        media_type=doc.content_type or "application/octet-stream",
    )


@router.delete("/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    """Delete a document by ID."""
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove file from disk
    file_path = _safe_file_path(doc.entity_type, doc.entity_id, doc.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(doc)
    db.commit()
    return {"status": "deleted"}


@router.put("/{document_id}")
def update_document(
    document_id: str,
    data: dict,
    db: Session = Depends(get_db),
):
    """Update document metadata (category, description)."""
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if "category" in data and data["category"] in ALLOWED_CATEGORIES:
        doc.category = data["category"]
    if "description" in data:
        doc.description = data["description"]

    db.commit()
    db.refresh(doc)
    return {
        "document_id": doc.document_id,
        "category": doc.category,
        "description": doc.description,
    }
