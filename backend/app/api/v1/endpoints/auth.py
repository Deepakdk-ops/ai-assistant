from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from redis import Redis
from redis.exceptions import RedisError
from app.db.session import get_db
from app.models.entities import User, AuthActionToken
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.api.dependencies import get_current_user
from app.core.config import settings
from app.services.email import send_email

router = APIRouter()
bearer = HTTPBearer()

class SignupIn(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=180)
    password: str = Field(min_length=12, max_length=128)

class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

class TokenIn(BaseModel):
    token: str = Field(min_length=20, max_length=256)

class ResetRequestIn(BaseModel):
    email: EmailStr

class ResetConfirmIn(TokenIn):
    password: str = Field(min_length=12, max_length=128)


def public_user(user: User):
    return {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role,
            "is_active": user.is_active, "email_verified": user.email_verified, "created_at": user.created_at}


def issue_action_token(db: Session, user: User, purpose: str, lifetime: timedelta) -> str:
    now = datetime.now(timezone.utc)
    db.query(AuthActionToken).filter(AuthActionToken.user_id == user.id, AuthActionToken.purpose == purpose, AuthActionToken.consumed_at.is_(None)).update({AuthActionToken.consumed_at: now})
    raw = secrets.token_urlsafe(32)
    digest = hashlib.sha256(raw.encode()).hexdigest()
    db.add(AuthActionToken(user_id=user.id, token_hash=digest, purpose=purpose,
                           expires_at=now + lifetime))
    db.commit()
    return raw


def consume_action_token(db: Session, raw: str, purpose: str) -> tuple[AuthActionToken, User]:
    digest = hashlib.sha256(raw.encode()).hexdigest()
    record = db.scalar(select(AuthActionToken).where(AuthActionToken.token_hash == digest,
                         AuthActionToken.purpose == purpose, AuthActionToken.consumed_at.is_(None)))
    now = datetime.now(timezone.utc)
    if not record or record.expires_at <= now:
        raise HTTPException(status_code=400, detail="Token is invalid or expired.")
    user = db.get(User, record.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Token is invalid or expired.")
    record.consumed_at = now
    return record, user


@router.post('/signup', status_code=201)
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    if not settings.allow_signup:
        raise HTTPException(403, 'New account registration is disabled.')
    email = payload.email.lower().strip()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(409, 'An account with this email already exists.')
    user = User(email=email, full_name=payload.full_name.strip(), password_hash=hash_password(payload.password), role='user')
    db.add(user); db.commit(); db.refresh(user)
    verification_token = issue_action_token(db, user, "verify_email", timedelta(hours=24))
    try:
        sent = send_email(user.email, "Verify your AI Assistant Workspace account",
                          f"Use this token to verify your email: {verification_token}\nIt expires in 24 hours.")
    except Exception:
        sent = False
    response = {"user": public_user(user), "verification_email_sent": sent,
                "message": "Account created. Verify your email if verification is required by this deployment."}
    if settings.environment.lower() != "production" and not sent:
        response["development_verification_token"] = verification_token
    if settings.require_email_verification:
        return response
    response.update({"access_token": create_access_token(user.id, user.role, user.token_version),
                     "token_type": "bearer", "expires_in": settings.access_token_minutes * 60})
    return response


@router.post('/login')
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower().strip()))
    if not user or not verify_password(payload.password, user.password_hash) or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, 'Invalid email or password.', headers={'WWW-Authenticate':'Bearer'})
    if settings.require_email_verification and not user.email_verified:
        raise HTTPException(status_code=403, detail="Verify your email before signing in.")
    return {"access_token": create_access_token(user.id, user.role, user.token_version), "token_type": "bearer",
            "expires_in": settings.access_token_minutes * 60, "user": public_user(user)}


@router.get('/me')
def me(user: User = Depends(get_current_user)):
    return public_user(user)


@router.post('/logout', status_code=204)
def logout(credentials: HTTPAuthorizationCredentials = Depends(bearer), user: User = Depends(get_current_user)):
    payload = decode_access_token(credentials.credentials)
    expires_at = int(payload.get("exp", 0))
    ttl = max(1, expires_at - int(datetime.now(timezone.utc).timestamp()))
    token_id = payload.get("jti")
    if not token_id:
        raise HTTPException(status_code=401, detail="Token is missing its identifier.")
    try:
        client = Redis.from_url(settings.redis_url, socket_connect_timeout=1, socket_timeout=1)
        client.setex(f"auth:revoked:{token_id}", ttl, "1")
        client.close()
    except RedisError:
        raise HTTPException(status_code=503, detail="Unable to revoke session; retry logout.")
    return None


@router.post('/verify-email')
def verify_email(payload: TokenIn, db: Session = Depends(get_db)):
    _, user = consume_action_token(db, payload.token, "verify_email")
    user.email_verified = True
    db.commit()
    return {"verified": True, "message": "Email address verified. You can now sign in."}


@router.post('/verify-email/request')
def request_verification(payload: ResetRequestIn, db: Session = Depends(get_db)):
    # Generic response prevents account enumeration.
    user = db.scalar(select(User).where(User.email == payload.email.lower().strip(), User.is_active.is_(True)))
    result = {"message": "If the account exists and needs verification, instructions will be sent."}
    if not user or user.email_verified:
        return result
    token = issue_action_token(db, user, "verify_email", timedelta(hours=24))
    try:
        sent = send_email(user.email, "Verify your AI Assistant Workspace account", f"Verification token: {token}\nExpires in 24 hours.")
    except Exception:
        sent = False
    result["sent"] = sent
    if settings.environment.lower() != "production" and not sent:
        result["development_verification_token"] = token
    return result


@router.post('/password-reset/request')
def request_password_reset(payload: ResetRequestIn, db: Session = Depends(get_db)):
    # Always return the same message to avoid revealing whether an email is registered.
    user = db.scalar(select(User).where(User.email == payload.email.lower().strip(), User.is_active.is_(True)))
    result = {"message": "If the account exists, password reset instructions will be sent."}
    if user:
        token = issue_action_token(db, user, "password_reset", timedelta(minutes=30))
        try:
            sent = send_email(user.email, "Reset your AI Assistant Workspace password",
                              f"Password reset token: {token}\nIt expires in 30 minutes. If you did not request this, ignore this email.")
        except Exception:
            sent = False
        if settings.environment.lower() != "production" and not sent:
            result["development_reset_token"] = token
    return result


@router.post('/password-reset/confirm')
def confirm_password_reset(payload: ResetConfirmIn, db: Session = Depends(get_db)):
    _, user = consume_action_token(db, payload.token, "password_reset")
    user.password_hash = hash_password(payload.password)
    user.token_version += 1  # invalidate every previously issued access token
    db.commit()
    return {"message": "Password reset completed. Sign in using your new password."}
