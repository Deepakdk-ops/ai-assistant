import asyncio, json
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError
from redis.asyncio import Redis
from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.entities import User

router = APIRouter()

@router.websocket("/ws/events")
async def task_events(websocket: WebSocket, token: str = ""):
    # Browser WebSocket APIs cannot set Authorization headers; require a short-lived JWT query parameter.
    await websocket.accept()
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        token_id = payload.get("jti")
        if not token_id:
            await websocket.close(code=1008, reason="Invalid token")
            return
        redis = Redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=2)
        if await redis.exists(f"auth:revoked:{token_id}"):
            await redis.aclose()
            await websocket.close(code=1008, reason="Session revoked")
            return
        db = SessionLocal()
        try: user = db.get(User, user_id) if user_id else None
        finally: db.close()
        if not user or not user.is_active:
            await websocket.close(code=1008, reason="Authentication required"); return
        pubsub = redis.pubsub()
        await pubsub.subscribe("workspace:events")
        await websocket.send_json({"type":"connection","status":"connected"})
        try:
            while True:
                if int(datetime.now(timezone.utc).timestamp()) >= int(payload.get("exp", 0)):
                    await websocket.close(code=1008, reason="Session expired")
                    break
                if await redis.exists(f"auth:revoked:{token_id}"):
                    await websocket.close(code=1008, reason="Session revoked")
                    break
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message.get("data"):
                    try: event=json.loads(message["data"])
                    except (ValueError, TypeError): continue
                    # Never broadcast one user's events to another user. Events without user IDs are not exposed.
                    if event.get("user_id") == user.id:
                        await websocket.send_json(event)
                await asyncio.sleep(0.15)
        finally:
            await pubsub.unsubscribe("workspace:events"); await pubsub.aclose(); await redis.aclose()
    except (JWTError, KeyError):
        await websocket.close(code=1008, reason="Invalid token")
    except WebSocketDisconnect:
        return
