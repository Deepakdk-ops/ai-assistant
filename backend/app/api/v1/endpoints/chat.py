from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.api import ChatIn, ChatOut
from app.services.chat import answer_chat
from app.models.entities import User
from app.api.dependencies import get_current_user

router = APIRouter()


@router.post("/chat", response_model=ChatOut)
async def chat(payload: ChatIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return await answer_chat(db, payload, user)
