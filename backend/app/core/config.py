from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator


class Settings(BaseSettings):
    app_name: str = "AI Assistant Workspace API"
    api_v1_prefix: str = "/api/v1"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://app_user:change_me@localhost:5432/ai_assistant"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    ollama_base_url: str = "http://localhost:11434"
    ollama_chat_model: str = "qwen2.5:3b"
    ollama_embed_model: str = "nomic-embed-text"
    embedding_dimensions: int = 768
    upload_dir: str = "./uploads"
    max_upload_mb: int = 15
    chunk_size: int = 900
    chunk_overlap: int = 150
    retrieval_top_k: int = 5
    jwt_secret_key: str = "CHANGE-ME-TO-A-LONG-RANDOM-SECRET-AT-LEAST-32-CHARS"
    access_token_minutes: int = 30
    allow_signup: bool = True
    require_email_verification: bool = False
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_starttls: bool = True
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"
    websocket_heartbeat_seconds: int = 25
    auth_rate_limit: int = 10
    auth_rate_window_seconds: int = 900

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @model_validator(mode="after")
    def validate_production_secrets(self):
        if self.environment.lower() == "production":
            if len(self.jwt_secret_key) < 32 or any(marker in self.jwt_secret_key.upper() for marker in ("CHANGE-ME", "REPLACE_WITH", "YOUR_SECRET")):
                raise ValueError("JWT_SECRET_KEY must be a strong random secret of at least 32 characters in production.")
            if "REPLACE_WITH" in self.database_url.upper() or "REPLACE-WITH" in self.redis_url.upper():
                raise ValueError("Configure non-placeholder database and Redis credentials in production.")
            if "localhost" in self.cors_origins or "127.0.0.1" in self.cors_origins:
                raise ValueError("Configure production CORS_ORIGINS explicitly; localhost origins are not allowed.")
            if self.require_email_verification and (not self.smtp_host or not self.smtp_from_email):
                raise ValueError("SMTP_HOST and SMTP_FROM_EMAIL are required when email verification is enabled.")
        return self

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
