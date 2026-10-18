# Operations and AI tutorial

## Request lifecycle

### Document RAG
1. The API validates authentication, extension and size, stores the original file in the persistent uploads volume, and creates an owner-scoped `Document` record.
2. Celery enqueues ingestion through Redis. The worker extracts PDF/DOCX/TXT/Markdown text, chunks it, requests embeddings from Ollama, and stores vectors in PostgreSQL/pgvector.
3. A RAG chat request verifies conversation, document and knowledge-base ownership. It embeds the query, retrieves only the current user's processed chunks (and selected collection when supplied), passes the excerpts to the chat model, and stores the answer and citations.
4. Redis Pub/Sub emits per-user task status; the authenticated WebSocket endpoint filters events by the signed-in user.

### General chatbot
The same chat endpoint can use general mode. It supplies the recent conversation history to the configured Ollama chat model and does not claim document citations.

### Agentic AI
Agent runs are queued through Celery. LangGraph executes retrieval and response nodes, stores run state/events, and exposes run status to the UI. The current workflow is deliberately bounded: it does not have unrestricted shell, browser, network or arbitrary tool execution. Human approval records are not yet a complete general-purpose interrupt/resume system.

### Evaluations
Create a fixed dataset of question/answer cases. Optionally provide expected document IDs to measure retrieval hits. Answer correctness is lexical token F1; it is a reproducible baseline, not semantic correctness or an LLM judge. Without labelled cases, the system runs a self-retrieval proxy and labels it accordingly.

## Local Docker deployment

Use the root README's Compose command. Before exposing the service beyond loopback, configure `ENVIRONMENT=production`, a strong JWT key, production CORS origins, SMTP if verification is required, firewall rules, TLS termination and tested backups. The default Compose ports bind to `127.0.0.1` and are intended for local use behind a host reverse proxy.

## Troubleshooting

- **RAG says no evidence:** wait for `processed`; check worker logs and `ollama pull nomic-embed-text`.
- **Embedding dimensions mismatch:** use the configured embedding model and matching `EMBEDDING_DIMENSIONS`; changing embedding models requires re-indexing and a vector schema migration.
- **Task remains queued:** check Redis health, worker logs and queue names (`ingestion`, `evaluations`, `agents`).
- **Live updates disconnected:** inspect WebSocket network requests and ensure `/api/v1/ws/events` is proxied with HTTP Upgrade headers.
- **Evaluation fails:** ensure processed documents exist or add labelled cases, then inspect `error_message` on the run.
- **Legacy documents disappear after migration:** records with no owner are hidden intentionally. Verify the correct account, back up the database, then run `python -m app.cli claim-legacy-data EMAIL`.

## Resume skills demonstrated

FastAPI, Pydantic, SQLAlchemy, Alembic, PostgreSQL/pgvector, REST APIs, JWT/RBAC foundations, Argon2 password hashing, Redis, Celery, WebSockets, LangGraph, RAG, Pytest, Docker Compose, GitHub Actions CI, structured operational workflows, and incident-oriented logs.
