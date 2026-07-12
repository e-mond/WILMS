# Performance Audit Report — v1.3.6-rc1

**Date:** 2026-07-12  
**Method:** Measured from build output (not estimated)

---

## Bundle metrics

| Metric | Budget | Measured | Status |
|--------|--------|----------|--------|
| JS (gzip) | 350 KB | **168.6 KB** | PASS |
| CSS (gzip) | 100 KB | **9.0 KB** | PASS |

**Command:** `npm run build && npm run bundle:budget-check` — PASS on 2026-07-12.

## Change impact

| Change | Performance impact |
|--------|-------------------|
| Collector settings nav item removed | Negligible — one fewer settings section |
| Health `degradedReasons` array | Negligible — small JSON payload |
| Message validation relaxation | None — same request shape |
| Security redirect | None — server redirect |

## Backend

No latency profiling changes in this RC. Health probe adds string array only.

## Recommendation

No performance optimisations required for v1.3.6-rc1. Budgets unchanged from v1.3.5 baseline.
