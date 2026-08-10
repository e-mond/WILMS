# Phase 33 — Reporting & Export Integrity

**Identity:** WILMS v1.8.0  
**Scope:** Deterministic domain aggregate checks (H10)

## Method

Compared pool hard-stop / outstanding math via `derivePoolAggregates` unit assertions. Reviewed that disbursement available capital uses `capital − outstanding` consistent with aggregate derivation.

## Result

| Check | Outcome |
|-------|---------|
| Outstanding = max(disbursed − collected, 0) | Pass |
| Available capital for hard-stop | Aligns with capital − outstanding |
| Dashboard vs export formula drift | No new deterministic defect proven this phase |

## Finding

| ID | Severity | Status | Summary |
|----|----------|--------|---------|
| H10 | Info | Residual | No confirmed recon/report cross-total inconsistency in this pack |

Cross-module export golden fixtures remain a follow-on hardening item, not a confirmed production defect.
