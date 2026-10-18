"""Deprecated compatibility shim. Schema changes are managed by Alembic migrations."""

def initialize_database() -> None:
    raise RuntimeError("Automatic schema creation is disabled. Run `alembic upgrade head` first.")
