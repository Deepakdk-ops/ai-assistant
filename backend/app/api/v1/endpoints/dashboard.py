from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, select
from app.db.session import get_db
from app.models.entities import Document, KnowledgeBase, Conversation, AgentRun, User
from app.api.dependencies import get_current_user

router = APIRouter()


@router.get("/summary")
def summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {
        "documents": db.scalar(select(func.count()).select_from(Document).where(Document.user_id == user.id)) or 0,
        "knowledge_bases": db.scalar(select(func.count()).select_from(KnowledgeBase).where(KnowledgeBase.user_id == user.id)) or 0,
        "conversations": db.scalar(select(func.count()).select_from(Conversation).where(Conversation.user_id == user.id)) or 0,
        "agent_runs": db.scalar(select(func.count()).select_from(AgentRun).where(AgentRun.user_id == user.id)) or 0,
    }
