from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from jose import jwt, JWTError
from pwdlib import PasswordHash
from app.core.config import settings

_password_hash = PasswordHash.recommended()
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return _password_hash.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    try:
        return _password_hash.verify(password, hashed)
    except Exception:
        return False

def create_access_token(subject: str, role: str, token_version: int = 0) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": subject, "role": role, "iat": now, "exp": now + timedelta(minutes=settings.access_token_minutes), "jti": secrets.token_urlsafe(16), "ver": token_version}, settings.jwt_secret_key, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[ALGORITHM])
