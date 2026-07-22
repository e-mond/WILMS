#!/usr/bin/env bash
# Phase 32 — Gate 2: Migration 0030 live execution evidence.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVIDENCE_DIR="$ROOT/docs/certification/v1.4/phase-32/evidence/operator"
mkdir -p "$EVIDENCE_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$EVIDENCE_DIR/migration-0030-${STAMP}.json"

DB_URL="${STAGING_DATABASE_URL:-${DATABASE_URL:-}}"
API_URL="${STAGING_API_URL:-}"

if [[ -z "$DB_URL" ]]; then
  cat > "$OUT" <<EOF
{
  "gate": "G2",
  "status": "BLOCKED",
  "reason": "STAGING_DATABASE_URL or DATABASE_URL required",
  "owner": "Operations",
  "command": "DATABASE_URL=<staging> npm run db:migrate -w @wilms/api",
  "expectedResult": "Migration 0030_v142_notification_dedupe applied; health watermark current",
  "evidenceFile": "evidence/operator/migration-0030.json",
  "risk": "Schema drift between code and deployed database",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
  echo "BLOCKED: missing database URL"
  exit 0
fi

log() { echo "[migration-gate] $*"; }

log "Applying migrations to staging database"
cd "$ROOT"
MIGRATE_LOG="$EVIDENCE_DIR/migration-0030-${STAMP}.log"
if ! DATABASE_URL="$DB_URL" npm run db:migrate -w @wilms/api 2>&1 | tee "$MIGRATE_LOG"; then
  cat > "$OUT" <<EOF
{
  "gate": "G2",
  "status": "FAIL",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "logFile": "$MIGRATE_LOG"
}
EOF
  exit 1
fi

HEALTH_JSON="null"
if [[ -n "$API_URL" ]]; then
  HEALTH_JSON=$(curl -fsS "${API_URL}/health" 2>/dev/null || echo "null")
fi

cat > "$OUT" <<EOF
{
  "gate": "G2",
  "status": "PASSED",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "logFile": "$MIGRATE_LOG",
  "health": $HEALTH_JSON
}
EOF
log "PASSED — evidence: $OUT"
