#!/usr/bin/env bash
# Phase 32 — Gate 10: Production configuration verification (presence only, no secrets).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVIDENCE_DIR="$ROOT/docs/certification/v1.4/phase-32/evidence/operator"
mkdir -p "$EVIDENCE_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$EVIDENCE_DIR/production-config-${STAMP}.json"

check() {
  local name="$1"
  local val="${2:-}"
  if [[ -n "$val" ]]; then echo "\"$name\":\"PRESENT\""; else echo "\"$name\":\"ABSENT\""; fi
}

# Only check env vars if operator exported them — never read .env files with secrets into output
ITEMS=$(cat <<EOF
$(check DATABASE_URL "${PROD_DATABASE_URL:-${DATABASE_URL:-}}"),
$(check WILMS_SESSION_SECRET "${PROD_WILMS_SESSION_SECRET:-${WILMS_SESSION_SECRET:-}}"),
$(check WILMS_SCHEDULER_TOKEN "${PROD_WILMS_SCHEDULER_TOKEN:-${WILMS_SCHEDULER_TOKEN:-}}"),
$(check MAIL_PROVIDER "${PROD_MAIL_PROVIDER:-${MAIL_PROVIDER:-}}"),
$(check SMS_PROVIDER "${PROD_SMS_PROVIDER:-${SMS_PROVIDER:-}}"),
$(check CLOUDINARY_CLOUD_NAME "${PROD_CLOUDINARY_CLOUD_NAME:-${CLOUDINARY_CLOUD_NAME:-}}"),
"NEXT_PUBLIC_USE_MOCK":"$( [[ "${NEXT_PUBLIC_USE_MOCK:-}" == "true" ]] && echo INVALID || echo VERIFIED )",
"NEXT_PUBLIC_DEMO_MODE":"$( [[ "${NEXT_PUBLIC_DEMO_MODE:-}" == "true" || "${NEXT_PUBLIC_FORCE_DEMO_MODE:-}" == "true" ]] && echo INVALID || echo VERIFIED )"
EOF
)

STATUS="BLOCKED"
if [[ -n "${PROD_VERIFICATION_MODE:-}" ]]; then
  STATUS="PASS"
fi

cat > "$OUT" <<EOF
{
  "gate": "G10",
  "status": "$STATUS",
  "reason": "Production deployment secrets not accessible from agent; operator must verify on hosting platform",
  "owner": "Operations",
  "checks": { $ITEMS },
  "command": "Verify Railway/Vercel env vars; curl /health and /ops/status on production (redacted)",
  "expectedResult": "All required vars PRESENT; mock/demo INVALID; migration watermark current",
  "evidenceFile": "evidence/operator/production-config.json",
  "risk": "Misconfiguration may expose demo mode or leave scheduler unprotected",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
echo "BLOCKED: production config requires operator verification"
exit 0
