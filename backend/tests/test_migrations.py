from pathlib import Path


def test_alembic_migration_is_present_and_additive():
    root = Path(__file__).parents[1]
    assert (root / "alembic.ini").exists()
    migration = root / "migrations" / "versions" / "0001_workspace_schema.py"
    source = migration.read_text()
    assert "ADD COLUMN IF NOT EXISTS user_id" in source
    assert "ix_documents_knowledge_base_id" in source


def test_compose_defines_api_worker_database_redis_and_frontend():
    source = (Path(__file__).parents[1] / "docker-compose.yml").read_text()
    for service in ("db:", "redis:", "migrate:", "api:", "worker:", "frontend:"):
        assert service in source
