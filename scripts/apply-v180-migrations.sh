#!/usr/bin/env bash
# Apply WILMS v1.8.0 migrations (0037–0039) against Neon / Postgres.
# drizzle-kit loads DATABASE_URL from the repository root `.env` only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f .env ]]; then
    # shellcheck disable=SC1091
    set -a
    source .env
    set +a
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set."
  echo "Add it to the repository root .env, then re-run:"
  echo "  npm run db:migrate -w @wilms/domain"
  echo "or:"
  echo "  ./scripts/apply-v180-migrations.sh"
  exit 1
fi

echo "Applying drizzle migrations (includes 0037 Ghana holidays, 0038 automation, 0039 holiday enrichment)…"
npm run db:migrate -w @wilms/domain
echo "Migration apply finished."
