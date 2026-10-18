from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from redis import Redis
from app.db.session import get_db
from app.core.config import settings

router = APIRouter()

@router.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    try:
        redis = Redis.from_url(settings.redis_url, socket_connect_timeout=1); redis.ping(); redis.close()
        redis_status = "connected"
    except Exception:
        redis_status = "unavailable"
    return {"status": "ok" if redis_status == "connected" else "degraded", "database": "connected", "redis": redis_status, "background_jobs": "celery worker health should be monitored separately"}
