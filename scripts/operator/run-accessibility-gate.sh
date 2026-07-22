#!/usr/bin/env bash
# Phase 32 — Gate 9: Accessibility and browser QA evidence.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVIDENCE_DIR="$ROOT/docs/certification/v1.4/phase-32/evidence/operator"
mkdir -p "$EVIDENCE_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$EVIDENCE_DIR/accessibility-${STAMP}.json"

# Run automated axe e2e only when Playwright browsers installed and servers available
if [[ "${RUN_AXE_E2E:-}" == "1" ]]; then
  cd "$ROOT"
  if npm run test:e2e -w @wilms/frontend -- e2e/accessibility.spec.ts 2>"$EVIDENCE_DIR/axe-${STAMP}.log"; then
    cat > "$OUT" <<EOF
{
  "gate": "G9",
  "status": "PASS",
  "automatedAxe": true,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "logFile": "$EVIDENCE_DIR/axe-${STAMP}.log"
}
EOF
    cp "$OUT" "$EVIDENCE_DIR/accessibility.json"
    exit 0
  fi
fi

cat > "$OUT" <<EOF
{
  "gate": "G9",
  "status": "BLOCKED",
  "reason": "Manual browser matrix (Chrome, Edge, Firefox, mobile) and Lighthouse require operator execution",
  "owner": "Product / QA",
  "automatedAxe": false,
  "command": "RUN_AXE_E2E=1 npm run test:e2e -w @wilms/frontend -- e2e/accessibility.spec.ts; plus manual WCAG checklist",
  "expectedResult": "axe violations documented; Lighthouse scores; keyboard-only walkthrough",
  "evidenceFiles": [
    "evidence/operator/accessibility.json",
    "evidence/operator/browser-matrix.json",
    "evidence/operator/lighthouse.json"
  ],
  "risk": "WCAG and cross-browser defects undetected",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
cp "$OUT" "$EVIDENCE_DIR/accessibility.json"
echo "BLOCKED: manual accessibility/browser QA required"
exit 0
