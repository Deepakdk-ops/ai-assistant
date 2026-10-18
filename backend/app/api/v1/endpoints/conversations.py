from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import Conversation, Message, User
from app.api.dependencies import get_current_user
from app.schemas.api import ConversationOut

router = APIRouter()


@router.get("", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(select(Conversation).where(Conversation.user_id == user.id).order_by(Conversation.updated_at.desc())).all()


@router.get("/{conversation_id}")
def get_conversation(conversation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    conversation = db.scalar(select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == user.id))
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    messages = db.scalars(select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)).all()
    return {
        "id": conversation.id,
        "title": conversation.title,
        "updated_at": conversation.updated_at,
        "messages": [
            {"id": m.id, "role": m.role, "content": m.content, "citations": m.citations or [], "insufficient_evidence": m.insufficient_evidence, "created_at": m.created_at}
            for m in messages
        ],
    }
