#!/usr/bin/env bash
# Phase 31 — operator evidence runner for notification scheduler + provider smoke.
#
# Required:
#   WILMS_API_BASE_URL
#   WILMS_SCHEDULER_TOKEN
# Optional:
#   REFERENCE_DATE=yyyy-mm-dd
#
# Usage:
#   export WILMS_API_BASE_URL=https://staging-api.example.com
#   export WILMS_SCHEDULER_TOKEN=...
#   bash scripts/operator/run-notification-scheduler.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVIDENCE_DIR="$ROOT/docs/certification/v1.4/phase-31/evidence/operator"
mkdir -p "$EVIDENCE_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$EVIDENCE_DIR/scheduler-${STAMP}.log"

log() {
  echo "[$(date -u +%H:%M:%S)] $*" | tee -a "$LOG"
}

if [[ -z "${WILMS_API_BASE_URL:-}" || -z "${WILMS_SCHEDULER_TOKEN:-}" ]]; then
  cat > "$EVIDENCE_DIR/scheduler-${STAMP}.json" <<EOF
{
  "status": "BLOCKED",
  "reason": "WILMS_API_BASE_URL and WILMS_SCHEDULER_TOKEN required",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
  log "BLOCKED: missing WILMS_API_BASE_URL or WILMS_SCHEDULER_TOKEN"
  exit 0
fi

BODY='{}'
if [[ -n "${REFERENCE_DATE:-}" ]]; then
  BODY=$(printf '{"referenceDate":"%s"}' "$REFERENCE_DATE")
fi

log "POST ${WILMS_API_BASE_URL}/notifications/scheduler/run"
HTTP_CODE=$(curl -sS -o "$EVIDENCE_DIR/payment-scheduler-${STAMP}.json" -w "%{http_code}" \
  -X POST "${WILMS_API_BASE_URL}/notifications/scheduler/run" \
  -H "Authorization: Bearer ${WILMS_SCHEDULER_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: operator-${STAMP}" \
  -d "$BODY")

log "HTTP ${HTTP_CODE}"
cat "$EVIDENCE_DIR/payment-scheduler-${STAMP}.json" | tee -a "$LOG"

STATUS="FAILED"
if [[ "$HTTP_CODE" == "200" ]]; then
  STATUS="PASSED"
fi

cat > "$EVIDENCE_DIR/scheduler-${STAMP}.json" <<EOF
{
  "status": "$STATUS",
  "httpCode": $HTTP_CODE,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "logFile": "$LOG",
  "responseFile": "$EVIDENCE_DIR/payment-scheduler-${STAMP}.json"
}
EOF

log "Result: $STATUS"
[[ "$STATUS" == "PASSED" ]]
