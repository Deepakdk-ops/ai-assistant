from fastapi import APIRouter, Depends
from app.api.dependencies import get_current_user
from app.api.v1.endpoints import health, dashboard, documents, chat, conversations, knowledge_bases, agents, evaluations, auth, settings_api

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
# All application APIs require a valid access token; resource handlers additionally enforce user ownership.
protected = [Depends(get_current_user)]
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"], dependencies=protected)
api_router.include_router(documents.router, prefix="/documents", tags=["documents"], dependencies=protected)
api_router.include_router(chat.router, tags=["chat"], dependencies=protected)
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"], dependencies=protected)
api_router.include_router(knowledge_bases.router, prefix="/knowledge-bases", tags=["knowledge-bases"], dependencies=protected)
api_router.include_router(agents.router, tags=["agents"], dependencies=protected)
api_router.include_router(evaluations.router, prefix="/evaluations", tags=["evaluations"], dependencies=protected)
api_router.include_router(settings_api.router, prefix="/settings", tags=["settings"], dependencies=protected)
