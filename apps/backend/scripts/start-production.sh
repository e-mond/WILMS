#!/usr/bin/env sh
# Production start: migrate then boot API. Logs migration output for Railway deploy diagnostics.
set -eu

echo "[wilms-api] NODE_ENV=${NODE_ENV:-unknown}"
echo "[wilms-api] Running database migrations..."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[wilms-api] ERROR: DATABASE_URL is not set — cannot migrate or connect." >&2
  exit 1
fi

if ! drizzle-kit migrate; then
  echo "[wilms-api] ERROR: drizzle-kit migrate failed — deployment aborted." >&2
  exit 1
fi

echo "[wilms-api] Migrations complete. Starting HTTP server..."
exec tsx src/index.ts
