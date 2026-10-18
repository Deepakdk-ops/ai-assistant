from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from redis import Redis
from redis.exceptions import RedisError
from app.db.session import get_db
from app.models.entities import User
from app.core.security import decode_access_token
from app.core.config import settings

bearer = HTTPBearer(auto_error=False)
def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        token_id = payload.get("jti")
        if not token_id:
            raise HTTPException(status_code=401, detail="Token is missing its identifier.")
        try:
            redis_client = Redis.from_url(settings.redis_url, socket_connect_timeout=1, socket_timeout=1, decode_responses=True)
            revoked = redis_client.exists(f"auth:revoked:{token_id}")
            redis_client.close()
        except RedisError:
            raise HTTPException(status_code=503, detail="Authentication service temporarily unavailable.")
        if revoked:
            raise HTTPException(status_code=401, detail="Session has been revoked.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired access token.", headers={"WWW-Authenticate": "Bearer"})
    user = db.get(User, user_id) if user_id else None
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User account is unavailable.")
    if payload.get("ver", 0) != user.token_version:
        raise HTTPException(status_code=401, detail="Session is no longer valid; please sign in again.")
    return user

def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Administrator role required.")
    return user
