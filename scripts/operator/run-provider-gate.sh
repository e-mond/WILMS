#!/usr/bin/env bash
# Phase 32 — Gate 6: Email/SMS provider delivery evidence.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVIDENCE_DIR="$ROOT/docs/certification/v1.4/phase-32/evidence/operator"
mkdir -p "$EVIDENCE_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$EVIDENCE_DIR/provider-delivery-${STAMP}.json"

MAIL_PROVIDER="${MAIL_PROVIDER:-none}"
SMS_PROVIDER="${SMS_PROVIDER:-none}"
API_URL="${STAGING_API_URL:-http://127.0.0.1:4010}"

# Document configured providers without exposing secrets
mail_configured="ABSENT"
sms_configured="ABSENT"
[[ "$MAIL_PROVIDER" != "none" && -n "${RESEND_API_KEY:-}${SMTP_PASSWORD:-}${GMAIL_APP_PASSWORD:-}" ]] && mail_configured="PRESENT"
[[ "$SMS_PROVIDER" != "none" && -n "${SMSNOTIFYGH_API_KEY:-}${TWILIO_AUTH_TOKEN:-}${ARKESEL_API_KEY:-}" ]] && sms_configured="PRESENT"

if [[ "$mail_configured" == "ABSENT" && "$sms_configured" == "ABSENT" && -z "${STAGING_API_URL:-}" ]]; then
  cat > "$OUT" <<EOF
{
  "gate": "G6",
  "status": "BLOCKED",
  "reason": "No mail/SMS provider credentials in environment; staging API not configured",
  "owner": "Operations",
  "mailProvider": "$MAIL_PROVIDER",
  "smsProvider": "$SMS_PROVIDER",
  "mailConfigured": "$mail_configured",
  "smsConfigured": "$sms_configured",
  "command": "Configure providers on staging; send test messages; attach redacted provider message IDs",
  "expectedResult": "Provider ACCEPTED or DELIVERED status with message ID",
  "evidenceFile": "evidence/operator/provider-delivery.json",
  "risk": "Borrower/collector notifications may fail silently",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "note": "CREATED ≠ QUEUED ≠ ACCEPTED ≠ DELIVERED"
}
EOF
  echo "BLOCKED: provider credentials not available"
  exit 0
fi

# If staging API available, query integration status endpoint (no secrets in response)
INTEGRATION_STATUS="null"
if curl -fsS "${API_URL}/health" >/dev/null 2>&1; then
  INTEGRATION_STATUS=$(curl -fsS "${API_URL}/ops/status" 2>/dev/null | head -c 4000 || echo "null")
fi

cat > "$OUT" <<EOF
{
  "gate": "G6",
  "status": "BLOCKED",
  "reason": "Provider delivery test requires operator to send test email/SMS and attach provider message IDs",
  "owner": "Operations",
  "mailProvider": "$MAIL_PROVIDER",
  "smsProvider": "$SMS_PROVIDER",
  "mailConfigured": "$mail_configured",
  "smsConfigured": "$sms_configured",
  "integrationStatusExcerpt": $(echo "$INTEGRATION_STATUS" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()[:2000]))' 2>/dev/null || echo 'null'),
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
echo "BLOCKED: operator must attach provider delivery evidence"
exit 0
