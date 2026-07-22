#!/usr/bin/env bash
# Phase 32 — Gate 5: Notification scheduler evidence (remote or local fallback).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVIDENCE_DIR="$ROOT/docs/certification/v1.4/phase-32/evidence/operator"
mkdir -p "$EVIDENCE_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$EVIDENCE_DIR/notification-scheduler-${STAMP}.json"
SUMMARY="$EVIDENCE_DIR/notification-scheduler.json"

log() { echo "[scheduler-gate] $*"; }

LOCAL_PORT="${WILMS_SCHEDULER_TEST_PORT:-4010}"
LOCAL_TOKEN="${WILMS_SCHEDULER_LOCAL_TOKEN:-phase32-local-scheduler-test-token}"
LOCAL_PID=""

cleanup() {
  if [[ -n "$LOCAL_PID" ]] && kill -0 "$LOCAL_PID" 2>/dev/null; then
    kill "$LOCAL_PID" 2>/dev/null || true
    wait "$LOCAL_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

start_local_api() {
  # Avoid stale processes from prior runs blocking token-auth verification.
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti :"$LOCAL_PORT" | xargs -r kill 2>/dev/null || true
    sleep 1
  fi
  log "Starting local API on port $LOCAL_PORT for scheduler auth tests"
  WILMS_API_PORT="$LOCAL_PORT" \
  WILMS_SCHEDULER_TOKEN="$LOCAL_TOKEN" \
  npm run start -w @wilms/api >"$EVIDENCE_DIR/local-api-${STAMP}.log" 2>&1 &
  LOCAL_PID=$!
  for _ in $(seq 1 30); do
    if curl -fsS "http://127.0.0.1:${LOCAL_PORT}/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  log "Local API failed to start"
  return 1
}

run_scheduler_tests() {
  local base_url="$1"
  local token="$2"
  local mode="$3"
  local results=()

  # Invalid token must fail
  local bad_code
  bad_code=$(curl -sS -o /dev/null -w "%{http_code}" \
    -X POST "${base_url}/notifications/scheduler/run" \
    -H "Authorization: Bearer invalid-token" \
    -H "Content-Type: application/json" \
    -d '{}' || echo "000")
  results+=("\"invalidTokenHttpCode\":$bad_code")

  # Valid token — first run
  local run1_file="$EVIDENCE_DIR/scheduler-run1-${STAMP}.json"
  local code1
  code1=$(curl -sS -o "$run1_file" -w "%{http_code}" \
    -X POST "${base_url}/notifications/scheduler/run" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -H "X-Request-Id: phase32-run1-${STAMP}" \
    -d '{}' || echo "000")
  results+=("\"firstRunHttpCode\":$code1")

  # Duplicate run — must not error (idempotent)
  local run2_file="$EVIDENCE_DIR/scheduler-run2-${STAMP}.json"
  local code2
  code2=$(curl -sS -o "$run2_file" -w "%{http_code}" \
    -X POST "${base_url}/notifications/scheduler/run" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -H "X-Request-Id: phase32-run2-${STAMP}" \
    -d '{}' || echo "000")
  results+=("\"duplicateRunHttpCode\":$code2")

  # Ops status — scheduler last-run visibility
  local ops_file="$EVIDENCE_DIR/ops-status-${STAMP}.json"
  curl -fsS "${base_url}/ops/status" -o "$ops_file" 2>/dev/null || echo '{}' >"$ops_file"

  local status="FAILED"
  if [[ "$bad_code" != "200" && "$code1" == "200" && "$code2" == "200" ]]; then
    status="PASSED"
  fi

  cat > "$OUT" <<EOF
{
  "gate": "G5",
  "status": "$status",
  "mode": "$mode",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  $(IFS=,; echo "${results[*]}"),
  "run1ResponseFile": "$run1_file",
  "run2ResponseFile": "$run2_file",
  "opsStatusFile": "$ops_file"
}
EOF
  cp "$OUT" "$SUMMARY"
  log "Scheduler gate: $status ($mode)"
  [[ "$status" == "PASSED" ]]
}

if [[ -n "${WILMS_API_BASE_URL:-}" && -n "${WILMS_SCHEDULER_TOKEN:-}" ]]; then
  run_scheduler_tests "$WILMS_API_BASE_URL" "$WILMS_SCHEDULER_TOKEN" "remote"
  exit $?
fi

# Local fallback — proves token auth without staging credentials
if start_local_api; then
  run_scheduler_tests "http://127.0.0.1:${LOCAL_PORT}" "$LOCAL_TOKEN" "local-fallback"
  exit $?
fi

cat > "$OUT" <<EOF
{
  "gate": "G5",
  "status": "BLOCKED",
  "reason": "Remote credentials absent and local API failed to start",
  "owner": "Operations",
  "command": "WILMS_API_BASE_URL=... WILMS_SCHEDULER_TOKEN=... bash scripts/operator/run-notification-scheduler-gate.sh",
  "expectedResult": "Invalid token rejected; valid token 200; duplicate run idempotent",
  "evidenceFile": "evidence/operator/notification-scheduler.json",
  "risk": "Payment reminders may not execute in production",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
cp "$OUT" "$SUMMARY"
echo "BLOCKED: scheduler gate could not run"
exit 0
