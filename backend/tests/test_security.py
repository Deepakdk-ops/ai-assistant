from types import SimpleNamespace
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from app.api import dependencies
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password


def test_password_hash_is_not_plaintext_and_verifies():
    encoded = hash_password("a-strong-test-password")
    assert encoded != "a-strong-test-password"
    assert verify_password("a-strong-test-password", encoded)
    assert not verify_password("wrong-password", encoded)


def test_access_token_has_subject_expiry_and_jti():
    token = create_access_token("user-123", "user")
    payload = decode_access_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "user"
    assert payload["exp"] > payload["iat"]
    assert payload["jti"]


def test_authentication_rejects_revoked_token(monkeypatch):
    token = create_access_token("user-123", "user")
    monkeypatch.setattr(dependencies.Redis, "from_url", staticmethod(lambda *args, **kwargs: SimpleNamespace(exists=lambda key: 1, close=lambda: None)))
    db = SimpleNamespace(get=lambda model, key: SimpleNamespace(id=key, is_active=True))
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    try:
        dependencies.get_current_user(credentials, db)
    except HTTPException as exc:
        assert exc.status_code == 401
        assert "revoked" in exc.detail
    else:
        raise AssertionError("Revoked token must be rejected")


def test_workspace_resources_have_owner_columns():
    from app.models.entities import Document, KnowledgeBase, Conversation, AgentRun, EvaluationRun
    for model in (Document, KnowledgeBase, Conversation, AgentRun, EvaluationRun):
        assert "user_id" in model.__table__.columns
