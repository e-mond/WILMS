#!/usr/bin/env bash
# Apply pending WILMS migrations (including v1.8.0 0037–0039).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${1:-}"
if [[ -n "${ENV_FILE}" ]]; then
  node scripts/apply-pending-migrations.mjs --env-file "${ENV_FILE}"
  exit 0
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f apps/backend/.env.local ]]; then
    node scripts/apply-pending-migrations.mjs --env-file apps/backend/.env.local
    exit 0
  fi
  if [[ -f .env ]]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set."
  echo "Usage:"
  echo "  ./scripts/apply-v180-migrations.sh apps/backend/.env.local"
  echo "  DATABASE_URL=... ./scripts/apply-v180-migrations.sh"
  exit 1
fi

node scripts/apply-pending-migrations.mjs
