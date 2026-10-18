#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
COMPOSE=(docker compose -f backend/docker-compose.yml)
STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="${1:-backups/$STAMP}"
mkdir -p "$DEST"
"${COMPOSE[@]}" exec -T db sh -c 'pg_dump --clean --if-exists -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$DEST/postgres.sql"
"${COMPOSE[@]}" run --rm --no-deps --entrypoint tar api -czf - -C /app/uploads . > "$DEST/uploads.tar.gz"
printf 'Backup written to %s\n' "$DEST"
printf 'Store this directory securely and test restoration before relying on it.\n'
