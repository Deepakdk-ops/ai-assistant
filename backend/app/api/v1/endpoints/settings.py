from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.entities import User, UserPreference
from app.core.config import settings
from fastapi import HTTPException

router = APIRouter()
class PreferenceIn(BaseModel):
    chat_model: str = Field(min_length=1, max_length=120)
    embedding_model: str = Field(min_length=1, max_length=120)
    retrieval_top_k: int = Field(ge=1, le=20)
    temperature: float = Field(ge=0, le=1)
@router.get('')
def get_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pref = db.get(UserPreference, user.id)
    return {"provider":"ollama", "chat_model": pref.chat_model if pref else settings.ollama_chat_model, "embedding_model": pref.embedding_model if pref else settings.ollama_embed_model, "retrieval_top_k": pref.retrieval_top_k if pref else settings.retrieval_top_k, "temperature": pref.temperature if pref else 0.2, "database":"PostgreSQL + pgvector", "environment":settings.environment}
@router.put('')
def save_settings(payload: PreferenceIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.embedding_model.strip() != settings.ollama_embed_model:
        raise HTTPException(status_code=422, detail="Embedding model is server-managed because it must match indexed vectors. Re-index documents before changing it.")
    pref = db.get(UserPreference, user.id)
    if not pref:
        pref = UserPreference(user_id=user.id)
        db.add(pref)
    pref.chat_model = payload.chat_model.strip()
    pref.embedding_model = payload.embedding_model.strip()
    pref.retrieval_top_k = payload.retrieval_top_k
    pref.temperature = payload.temperature
    db.commit(); db.refresh(pref)
    return {"provider":"ollama", "chat_model":pref.chat_model, "embedding_model":pref.embedding_model, "retrieval_top_k":pref.retrieval_top_k, "temperature":pref.temperature}
