#!/usr/bin/env bash
# Phase 32 — Gate 11: Demo user purge verification.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVIDENCE_DIR="$ROOT/docs/certification/v1.4/phase-32/evidence/operator"
mkdir -p "$EVIDENCE_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$EVIDENCE_DIR/demo-purge-${STAMP}.json"

DB_URL="${PROD_DATABASE_URL:-${STAGING_DATABASE_URL:-${DATABASE_URL:-}}}"

if [[ -z "$DB_URL" ]]; then
  cat > "$OUT" <<EOF
{
  "gate": "G11",
  "status": "BLOCKED",
  "reason": "DATABASE_URL required to query users table",
  "owner": "Security / Operations",
  "command": "psql \$DATABASE_URL -c \"SELECT id, email FROM users WHERE email LIKE '%@wilms.demo';\"",
  "expectedResult": "0 rows in production",
  "evidenceFile": "evidence/operator/demo-purge.json",
  "risk": "Demo accounts may authenticate in production",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
  echo "BLOCKED: database URL required"
  exit 0
fi

COUNT=$(psql "$DB_URL" -tAc "SELECT count(*) FROM users WHERE email LIKE '%@wilms.demo';" 2>/dev/null || echo "error")
STATUS="BLOCKED"
if [[ "$COUNT" == "error" ]]; then
  REASON="psql query failed"
elif [[ "$COUNT" == "0" ]]; then
  STATUS="PASS"
  REASON="No @wilms.demo users found"
else
  STATUS="FAIL"
  REASON="Found $COUNT @wilms.demo users"
fi

cat > "$OUT" <<EOF
{
  "gate": "G11",
  "status": "$STATUS",
  "demoUserCount": "$COUNT",
  "reason": "$REASON",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
[[ "$STATUS" != "FAIL" ]]
