from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.entities import Document, DocumentChunk, KnowledgeBase
from app.schemas.api import DocumentListOut, DocumentOut
from app.services.ingestion import extract_pages
from app.services.rag import ingest_document
from app.tasks import process_document
from app.models.entities import User
from app.api.dependencies import get_current_user

router = APIRouter()
ALLOWED_SUFFIXES = {".pdf", ".docx", ".txt", ".md"}


@router.get("", response_model=DocumentListOut)
def list_documents(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    docs = db.scalars(select(Document).where(Document.user_id == user.id).order_by(Document.created_at.desc())).all()
    return {"items": docs, "total": len(docs)}


@router.post("", response_model=DocumentOut, status_code=201)
async def create_document(file: UploadFile = File(...), knowledge_base_id: str | None = Form(default=None), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    original_name = Path(file.filename or "upload").name
    suffix = Path(original_name).suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(status_code=415, detail="Supported file types: PDF, DOCX, TXT, MD.")
    max_bytes = settings.max_upload_mb * 1024 * 1024
    content = await file.read(max_bytes + 1)
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.max_upload_mb} MB limit.")

    if knowledge_base_id:
        kb = db.scalar(select(KnowledgeBase).where(KnowledgeBase.id == knowledge_base_id, KnowledgeBase.user_id == user.id))
        if not kb:
            raise HTTPException(status_code=404, detail="Knowledge base not found.")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_path = upload_dir / f"{uuid4().hex}{suffix}"
    stored_path.write_bytes(content)
    doc = Document(
        user_id=user.id,
        knowledge_base_id=knowledge_base_id,
        name=original_name,
        content_type=file.content_type,
        size_bytes=len(content),
        status="processing",
        storage_path=str(stored_path),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    try:
        process_document.delay(doc.id, user.id)
    except Exception as exc:
        doc.status = "failed"
        doc.error_message = f"Could not enqueue ingestion. Check Redis/Celery worker: {str(exc)[:500]}"
        db.commit(); db.refresh(doc)
    return doc


@router.delete("/{document_id}", status_code=204)
def remove_document(document_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    doc = db.scalar(select(Document).where(Document.id == document_id, Document.user_id == user.id))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    path = Path(doc.storage_path) if doc.storage_path else None
    db.delete(doc)
    db.commit()
    if path:
        path.unlink(missing_ok=True)
    return None
