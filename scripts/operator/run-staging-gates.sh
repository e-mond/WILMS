#!/usr/bin/env bash
# Phase 29 — operator staging gate runner (does NOT fabricate success).
#
# Required environment variables (never commit values):
#   STAGING_API_URL          Base URL, e.g. https://staging.example.com
#   STAGING_ADMIN_EMAIL      Non-demo admin account
#   STAGING_ADMIN_PASSWORD   Admin password
# Optional role accounts:
#   STAGING_COLLECTOR_EMAIL / STAGING_COLLECTOR_PASSWORD
#   STAGING_OFFICER_EMAIL   / STAGING_OFFICER_PASSWORD
#   STAGING_APPROVER_EMAIL  / STAGING_APPROVER_PASSWORD
#   STAGING_AUDITOR_EMAIL   / STAGING_AUDITOR_PASSWORD
#
# Usage:
#   export STAGING_API_URL=...
#   export STAGING_ADMIN_EMAIL=...
#   export STAGING_ADMIN_PASSWORD=...
#   bash scripts/operator/run-staging-gates.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVIDENCE_DIR="$ROOT/docs/certification/v1.4/phase-29/evidence/operator"
mkdir -p "$EVIDENCE_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$EVIDENCE_DIR/staging-gates-${STAMP}.log"

log() {
  echo "[$(date -u +%H:%M:%S)] $*" | tee -a "$LOG"
}

if [[ -z "${STAGING_API_URL:-}" || -z "${STAGING_ADMIN_EMAIL:-}" || -z "${STAGING_ADMIN_PASSWORD:-}" ]]; then
  cat > "$EVIDENCE_DIR/staging-gates-${STAMP}.json" <<EOF
{
  "status": "BLOCKED",
  "reason": "STAGING_API_URL, STAGING_ADMIN_EMAIL, STAGING_ADMIN_PASSWORD required",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "logFile": null
}
EOF
  log "BLOCKED: missing staging credentials"
  exit 0
fi

if [[ "$STAGING_ADMIN_EMAIL" == *"@wilms.demo" ]]; then
  log "REFUSED: do not use @wilms.demo accounts for staging certification"
  exit 2
fi

log "Running production smoke against $STAGING_API_URL"
export WILMS_APP_URL="$STAGING_API_URL"
export WILMS_API_URL="${STAGING_API_URL}/api/wilms"
export WILMS_SMOKE_ADMIN_EMAIL="$STAGING_ADMIN_EMAIL"
export WILMS_SMOKE_ADMIN_PASSWORD="$STAGING_ADMIN_PASSWORD"

cd "$ROOT"
npm run smoke:production -w @wilms/api 2>&1 | tee -a "$LOG"
SMOKE_EXIT=${PIPESTATUS[0]}

log "Running RBAC smoke"
npm run smoke:rbac -w @wilms/api 2>&1 | tee -a "$LOG"
RBAC_EXIT=${PIPESTATUS[0]}

STATUS="FAILED"
if [[ "$SMOKE_EXIT" -eq 0 && "$RBAC_EXIT" -eq 0 ]]; then
  STATUS="PASSED"
fi

cat > "$EVIDENCE_DIR/staging-gates-${STAMP}.json" <<EOF
{
  "status": "$STATUS",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "smokeExitCode": $SMOKE_EXIT,
  "rbacExitCode": $RBAC_EXIT,
  "logFile": "$LOG"
}
EOF

log "Result: $STATUS (evidence: staging-gates-${STAMP}.json)"
exit $(( SMOKE_EXIT + RBAC_EXIT ))
