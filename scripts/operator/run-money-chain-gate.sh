#!/usr/bin/env bash
# Phase 32 — Gate 4: Complete money-chain staging evidence.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVIDENCE_DIR="$ROOT/docs/certification/v1.4/phase-32/evidence/operator"
mkdir -p "$EVIDENCE_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$EVIDENCE_DIR/money-chain-${STAMP}.json"

if [[ -z "${STAGING_API_URL:-}" || -z "${STAGING_ADMIN_EMAIL:-}" || -z "${STAGING_ADMIN_PASSWORD:-}" ]]; then
  cat > "$OUT" <<EOF
{
  "gate": "G4",
  "status": "BLOCKED",
  "reason": "STAGING_API_URL, STAGING_ADMIN_EMAIL, STAGING_ADMIN_PASSWORD required",
  "owner": "Finance / Operations",
  "command": "Execute money-chain per docs/certification/v1.4/phase-29/templates/money-chain-evidence.md",
  "expectedResult": "Full lifecycle with IDs, amounts, notifications, audit events",
  "evidenceFile": "evidence/operator/money-chain.json",
  "risk": "Financial workflow defects undetected until production",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
  echo "BLOCKED: staging credentials required for money-chain"
  exit 0
fi

cd "$ROOT"
export WILMS_APP_URL="$STAGING_API_URL"
export WILMS_API_URL="${STAGING_API_URL}/api/wilms"
export WILMS_SMOKE_ADMIN_EMAIL="$STAGING_ADMIN_EMAIL"
export WILMS_SMOKE_ADMIN_PASSWORD="$STAGING_ADMIN_PASSWORD"

LOG="$EVIDENCE_DIR/money-chain-${STAMP}.log"
# Financial harness against live DB when DATABASE_URL set; otherwise smoke only
if [[ -n "${STAGING_DATABASE_URL:-}" ]]; then
  DATABASE_URL="$STAGING_DATABASE_URL" npm run verify:financial -w @wilms/api 2>&1 | tee "$LOG"
  EXIT=${PIPESTATUS[0]}
else
  npm run smoke:production -w @wilms/api 2>&1 | tee "$LOG"
  EXIT=${PIPESTATUS[0]}
fi

STATUS="FAILED"
[[ "$EXIT" -eq 0 ]] && STATUS="PASSED"

cat > "$OUT" <<EOF
{
  "gate": "G4",
  "status": "$STATUS",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "logFile": "$LOG"
}
EOF
exit "$EXIT"
