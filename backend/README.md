# FastAPI backend

See the repository root README for the Docker Compose startup and full workflow. Key commands inside the backend container:

```bash
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
celery -A app.worker:celery_app worker --loglevel=INFO --queues=ingestion,evaluations,agents
python -m app.cli promote-admin user@example.com
python -m app.cli claim-legacy-data user@example.com
```

The API is versioned under `/api/v1`. `/api/v1/health` is unauthenticated; application routes require a bearer token. Database schema is managed with Alembic; automatic `create_all()` at API startup is disabled.
