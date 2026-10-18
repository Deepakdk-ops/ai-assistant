"""Create schema and safely add ownership columns to earlier workspace installs."""
from alembic import op
from sqlalchemy import text
from app.db.base import Base
from app.models import entities  # noqa: F401

revision = "0001_workspace_schema"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    bind.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    # create_all creates missing tables; additive ALTER statements below upgrade existing tables.
    Base.metadata.create_all(bind=bind)
    bind.execute(text("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE"))
    bind.execute(text("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0"))
    for table in ("documents", "knowledge_bases", "conversations", "agent_definitions", "agent_runs", "evaluation_runs"):
        bind.execute(text(f'ALTER TABLE "{table}" ADD COLUMN IF NOT EXISTS user_id VARCHAR(36)'))
        bind.execute(text(f'CREATE INDEX IF NOT EXISTS "ix_{table}_user_id" ON "{table}" (user_id)'))
    for table in ("documents", "knowledge_bases", "conversations", "agent_definitions", "agent_runs", "evaluation_runs"):
        constraint_name = f"{table}_user_id_fkey"
        bind.execute(text(f"""DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '{constraint_name}') THEN
                ALTER TABLE "{table}" ADD CONSTRAINT "{constraint_name}" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
            END IF;
        END $$;"""))
    bind.execute(text("ALTER TABLE IF EXISTS documents ADD COLUMN IF NOT EXISTS knowledge_base_id VARCHAR(36) REFERENCES knowledge_bases(id) ON DELETE SET NULL"))
    bind.execute(text("CREATE INDEX IF NOT EXISTS ix_documents_knowledge_base_id ON documents (knowledge_base_id)"))
    bind.execute(text("ALTER TABLE IF EXISTS evaluation_runs ADD COLUMN IF NOT EXISTS error_message TEXT"))
    bind.execute(text("ALTER TABLE IF EXISTS documents ADD COLUMN IF NOT EXISTS error_message TEXT"))
    # Existing rows remain unowned and are intentionally hidden from regular users until an admin
    # performs an explicit ownership reassignment; never silently expose legacy data.

def downgrade():
    # Destructive schema downgrade is intentionally not automated for a user-data application.
    raise RuntimeError("Downgrade is disabled; restore from a verified backup instead.")
