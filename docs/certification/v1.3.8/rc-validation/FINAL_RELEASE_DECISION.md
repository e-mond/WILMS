# Final Release Decision — WILMS v1.3.8 RC

**Date:** 17 July 2026  
**Certification team posture:** Independent — evidence over aspiration

---

## Decision

### CONDITIONAL PASS — Release Candidate for operational enterprise deployment

WILMS **may** proceed as a **v1.3.8 Release Candidate** for production use as an **interest-free field lending / collections platform**, provided the conditions below are met.

WILMS **must not** be marketed as:

- a statutory general ledger / banking core  
- Fortune-500 acquisition-ready without the High backlog  
- proven at 100k–1M row scale without load testing  

---

## What was validated

1. Critical/High financial remediations remain intact in code  
2. Phase 18 KPI SQL + indexes present on RC baseline  
3. Automated regression suites green (financial, RBAC, recon, health, tour)  
4. Cross-module money chain propagates (loan→pool→payment→expense→dashboard)  
5. One High defect found (recon history IDOR) — **fixed on this branch**  
6. No Critical regressions remaining  

---

## Conditions (must)

| # | Condition |
|---|---|
| 1 | Merge Phase 18 excellence + RC validation branch to `main` |
| 2 | Apply migration `0027_hot_query_indexes` on every environment |
| 3 | Staging authenticated smoke: fee → approve → disburse → collect → reverse → expense → recon → dashboard |
| 4 | `/health` shows migrations watermark current after deploy |
| 5 | Ops acknowledge in-process queue / optional idempotency as accepted residual risk until v1.4 |

---

## Explicit non-blockers for this RC (tracked for v1.4+)

- Durable workers  
- Mandatory Idempotency-Key  
- Double-entry GL  
- OpenTelemetry  
- Org-wide cursor pagination  
- Multi-branch ABAC  

---

## Sign-off statement

**We certify WILMS v1.3.8 as a Release Candidate for operational microfinance deployment under the conditions above.**

**We do not certify WILMS as a best-in-class, acquisition-grade, multi-branch statutory financial platform.**

Next gate: v1.4 hardening (queues, idempotency, SQL lists, observability) → re-validate → then GL track (v1.5).
