from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import KnowledgeBase, User
from app.api.dependencies import get_current_user
from app.schemas.api import KnowledgeBaseIn, KnowledgeBaseOut

router = APIRouter()


@router.get("", response_model=list[KnowledgeBaseOut])
def list_knowledge_bases(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(select(KnowledgeBase).where(KnowledgeBase.user_id == user.id).order_by(KnowledgeBase.created_at.desc())).all()


@router.post("", response_model=KnowledgeBaseOut, status_code=201)
def create_knowledge_base(payload: KnowledgeBaseIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = KnowledgeBase(user_id=user.id, name=payload.name, description=payload.description)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/{knowledge_base_id}", response_model=KnowledgeBaseOut)
def get_knowledge_base(knowledge_base_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.scalar(select(KnowledgeBase).where(KnowledgeBase.id == knowledge_base_id, KnowledgeBase.user_id == user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge base not found.")
    return item
