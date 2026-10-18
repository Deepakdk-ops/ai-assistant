# Verification report

Date: 2026-10-17 (authoring environment)

## Checks that passed

- `python -m compileall -q backend/app backend/migrations backend/tests` — passed.
- `PYTHONPATH=. pytest -q tests/test_ingestion.py tests/test_migrations.py` from `backend/` — **5 passed**.
- YAML parse of `backend/docker-compose.yml`, `.github/workflows/ci.yml`, and `.github/workflows/deploy-self-hosted.yml` — passed.
- TypeScript/TSX syntax transpilation using the globally available TypeScript compiler API — **43 source files passed syntax transpilation**.

## Checks that could not be completed

- Full backend pytest suite: blocked during collection because `python-jose` (and other declared runtime dependencies) are not installed in this environment. `pip install -e '.[dev]'` failed because the environment could not resolve the package index (DNS/network unavailable).
- Full frontend type-check/build: blocked because npm dependencies are absent and `npm ci --offline` failed due missing cached packages. The TypeScript compiler did not report TSX syntax errors, but this is **not** a substitute for the full type-check/build.
- Docker Compose build/start, Alembic against PostgreSQL, Redis/Celery worker execution, Ollama calls, WebSocket end-to-end behavior, browser flows, migration upgrade against an existing database, and backup/restore drill: not run because Docker is not installed in the authoring environment.
- Ruff lint: not run because Ruff is not installed.

## Release status

This is a hardened development/release candidate, **not a verified production release**. Run the included CI workflow and test the full Docker stack on the target self-hosted machine before using sensitive documents. In particular, test SMTP delivery, email verification/password reset, tenant isolation, Redis-backed token revocation/rate limits, Celery retries, knowledge-base scoping, and database migration from a copy of the existing database.
