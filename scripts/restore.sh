#!/usr/bin/env bash
set -euo pipefail
if [[ $# -ne 1 || ! -d "$1" ]]; then echo "Usage: $0 BACKUP_DIRECTORY" >&2; exit 2; fi
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
COMPOSE=(docker compose -f backend/docker-compose.yml)
echo "WARNING: this overwrites the target database and uploads volume. Stop the app and verify the backup first."
read -r -p "Type RESTORE to continue: " confirmation
[[ "$confirmation" == "RESTORE" ]] || exit 1
"${COMPOSE[@]}" exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" "$POSTGRES_DB"' < "$1/postgres.sql"
"${COMPOSE[@]}" run --rm --no-deps -T --entrypoint tar api -xzf - -C /app/uploads < "$1/uploads.tar.gz"
printf 'Restore complete. Verify application behavior before reopening access.\n'
