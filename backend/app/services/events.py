import json
from redis import Redis
from app.core.config import settings

def publish_event(user_id: str | None, task_type: str, resource_id: str, status: str, detail: str | None = None, progress: int | None = None):
    try:
        client = Redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=2)
        payload = {"type": task_type, "resource_id": resource_id, "status": status, "detail": detail, "progress": progress}
        if user_id: payload["user_id"] = user_id
        client.publish("workspace:events", json.dumps(payload))
        client.close()
    except Exception:
        # Task execution must not fail solely because real-time notifications are temporarily unavailable.
        pass
