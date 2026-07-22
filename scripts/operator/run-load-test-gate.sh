#!/usr/bin/env bash
# Phase 32 — Gate 8: Load test evidence (staging preferred; local health fallback).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVIDENCE_DIR="$ROOT/docs/certification/v1.4/phase-32/evidence/operator"
mkdir -p "$EVIDENCE_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$EVIDENCE_DIR/load-test-${STAMP}.json"

TARGET="${STAGING_API_URL:-}"
MODE="staging"
if [[ -z "$TARGET" ]]; then
  TARGET="http://127.0.0.1:4000"
  MODE="local-health-only"
  if ! curl -fsS "${TARGET}/health" >/dev/null 2>&1; then
    cat > "$OUT" <<EOF
{
  "gate": "G8",
  "status": "BLOCKED",
  "reason": "STAGING_API_URL required for realistic load test; local API not running",
  "owner": "Operations / Engineering",
  "command": "Run k6/autocannon against staging endpoints with auth",
  "expectedResult": "p50/p95/p99 latency, error rate < 1%, no pool saturation",
  "evidenceFile": "evidence/operator/load-test.json",
  "risk": "Performance regressions under concurrency undetected",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    echo "BLOCKED: no staging URL and local API unavailable"
    exit 0
  fi
fi

# Lightweight health endpoint load probe (not a substitute for full staging load test)
REQUESTS=100
CONCURRENCY=10
TIMINGS_FILE="$EVIDENCE_DIR/load-timings-${STAMP}.txt"
> "$TIMINGS_FILE"

start_ms=$(date +%s%3N)
for i in $(seq 1 "$REQUESTS"); do
  (
    t0=$(date +%s%3N)
    code=$(curl -sS -o /dev/null -w "%{http_code}" "${TARGET}/health" || echo "000")
    t1=$(date +%s%3N)
    echo "$((t1 - t0)) $code" >> "$TIMINGS_FILE"
  ) &
  if (( i % CONCURRENCY == 0 )); then wait; fi
done
wait
end_ms=$(date +%s%3N)

python3 <<PY >"$OUT"
import json, statistics
from pathlib import Path
lines = Path("$TIMINGS_FILE").read_text().strip().splitlines()
times = []
errors = 0
for line in lines:
    parts = line.split()
    if len(parts) != 2: continue
    ms, code = int(parts[0]), parts[1]
    times.append(ms)
    if code != "200": errors += 1
times.sort()
def pct(p):
    if not times: return 0
    idx = max(0, int(len(times)*p/100)-1)
    return times[idx]
status = "BLOCKED" if "$MODE" == "local-health-only" else ("PASSED" if errors == 0 else "FAIL")
print(json.dumps({
  "gate": "G8",
  "status": status,
  "mode": "$MODE",
  "target": "$TARGET",
  "requests": len(times),
  "concurrency": $CONCURRENCY,
  "errorCount": errors,
  "errorRate": round(errors/max(len(times),1), 4),
  "p50Ms": pct(50),
  "p95Ms": pct(95),
  "p99Ms": pct(99),
  "avgMs": round(statistics.mean(times), 2) if times else 0,
  "durationMs": $end_ms - $start_ms,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "note": "Health-only probe; full staging load test still required for certification" if "$MODE" == "local-health-only" else "Staging health load probe"
}, indent=2))
PY

cat "$OUT"
if grep -q '"status": "BLOCKED"' "$OUT"; then exit 0; fi
grep -q '"status": "PASSED"' "$OUT"
