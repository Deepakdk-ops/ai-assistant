# AI Assistant Workspace

Self-hosted, local-first GenAI/RAG and Agentic AI workspace. Stack: React + TypeScript + Tailwind, FastAPI, PostgreSQL + pgvector, Redis, Celery, LangGraph, Ollama, WebSockets, Docker Compose and GitHub Actions.

## Start locally with Docker

**Prerequisites:** Docker Engine/Desktop with Compose v2, and Ollama installed on the host. For the default models, pull them before starting the stack:

```bash
ollama pull qwen2.5:3b
ollama pull nomic-embed-text
```

From this project directory:

```bash
cp backend/.env.example backend/.env
# Edit backend/.env: set unique secrets (use hex strings so URLs remain valid).
# Example: openssl rand -hex 32

docker compose -f backend/docker-compose.yml up --build -d
```

Open:

- Workspace: http://localhost:8080
- API docs: http://localhost:8000/docs (bound to loopback only)
- Health: http://localhost:8000/api/v1/health

The compose stack contains PostgreSQL/pgvector, Redis, a one-shot Alembic migration service, FastAPI, Celery worker, and an Nginx-served frontend. The frontend proxies `/api/` and WebSocket traffic through Nginx, so local browser requests use one origin. Ollama is reached at `host.docker.internal:11434`.

## First use

1. Create an account at `/signup` and sign in.
2. In **Knowledge bases**, create a collection (optional).
3. In **Documents**, upload a PDF, DOCX, TXT or Markdown file and optionally assign it to a collection.
4. Wait until the document status is `processed`. Ingestion is performed by Celery and status events are published over Redis/WebSockets.
5. Open **AI Chat**. Use **Document RAG** for answers grounded in your indexed files with citations, or **General chatbot** for ordinary conversational questions.
6. In **AI Agents**, start a LangGraph retrieval-and-response workflow and inspect its run/events.
7. In **Evaluation lab**, add labelled questions and optional expected document IDs, then run an evaluation. Without labelled cases, the system reports a self-retrieval proxy, not benchmark-grade recall. Answer correctness uses token F1 and is not a semantic judge.
8. Configure chat model, temperature and top-k in **Settings**. Embedding model is intentionally server-managed because it must match the vectors already stored.

## Security and data ownership

- Passwords are Argon2-hashed; access tokens are short-lived JWTs and logout revokes a token through Redis.
- Protected APIs validate the user; documents, conversations, knowledge bases, agent runs, evaluations, and retrieval are scoped to that user. Login/signup/password-reset request endpoints have Redis-backed IP rate limits; API and Nginx set baseline security headers.
- Legacy rows created before ownership columns were introduced remain unowned and hidden by default. After verifying the intended account, an operator can explicitly assign unowned rows with `python -m app.cli claim-legacy-data EMAIL` from the backend container.
- Promote an operator with `python -m app.cli promote-admin EMAIL`.
- Signup, login, logout, email verification and password reset endpoints are implemented. Configure SMTP to deliver verification/reset tokens. In development only, the API returns a development token if SMTP is not configured; production never returns those tokens in API responses.
- `REQUIRE_EMAIL_VERIFICATION=true` blocks login until verification. In production, set `ENVIRONMENT=production`, a non-local `CORS_ORIGINS`, `JWT_SECRET_KEY`, database/Redis secrets, and SMTP configuration if verification is required.
- The browser stores the short-lived bearer token in localStorage. This is not ideal for high-risk applications exposed to untrusted scripts; for internet-facing deployments, place the app behind a hardened reverse proxy and consider an HttpOnly-cookie BFF.

## Migrations, backups and recovery

Alembic runs automatically through the `migrate` service. Back up PostgreSQL and the `uploads` named volume before upgrades. The migration adds ownership columns without assigning old records to a user; this is deliberate to prevent accidental cross-account exposure.

```bash
# PostgreSQL backup
mkdir -p backups
docker compose -f backend/docker-compose.yml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "backups/postgres-$(date +%Y%m%d-%H%M%S).sql"

# Inspect service status/logs
docker compose -f backend/docker-compose.yml ps
docker compose -f backend/docker-compose.yml logs --tail=200 api worker migrate
```

Keep a separate backup of the Docker volume `uploads`; PostgreSQL alone does not contain the original uploaded files.

## CI

`.github/workflows/ci.yml` runs Ruff, Python compilation, pytest, frontend TypeScript checks/build, and a Docker image build on pushes and pull requests to `main`/`master`. A separate manual `deploy-self-hosted.yml` workflow performs SSH-based deployment after you configure GitHub environment secrets (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_SSH_PRIVATE_KEY`, and pinned `DEPLOY_SSH_KNOWN_HOSTS`). It is manual by design; take a backup and verify the target ref before deploying. Rollback is performed by checking out a previously verified commit and redeploying.

## Current verification status

The code was syntax-compiled in the authoring environment. The ingestion and migration-file tests passed (5 tests). Full pytest collection could not run because runtime packages such as `python-jose` are not installed here and package installation failed because this environment has no DNS/network access. Docker is not installed in the authoring environment, so container startup, PostgreSQL/Alembic, Redis/Celery, Ollama, WebSocket, and browser end-to-end tests have **not** been executed here. Do not interpret source generation or CI configuration as proof of production readiness; run the complete stack and CI before handling sensitive data.
