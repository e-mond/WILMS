# Performance Audit — Phase 26 (v1.4.1)

**Date:** 2026-07-21  
**Baseline:** Phase 25 performance report; final-system-audit performance pack  
**Live load test:** **Not verified** (no fabricated numbers)

---

## Changes with performance impact (Verified)

| Change | Effect | Evidence |
|--------|--------|----------|
| `getPaymentById` → `findPaymentById` | Removes capped list scan (up to 2000 rows) for single-payment GET | `payments/service.ts` |
| Pool `refreshPoolAggregates` on adjustment approve | Keeps utilisation coherent after capital-affecting adjustments | `adjustments/service.ts` |
| `LOAN_CREATE` idempotency | Prevents duplicate create storms under retry | `loans/service.ts` + idempotency infra |

---

## Unchanged posture

| Area | Status | Notes |
|------|--------|-------|
| Money reports | Fail-closed **422** when unpaginated lists would exceed 2000-row safety cap | Safety brake, not a scale solution |
| Dashboard KPIs | SQL aggregates (financial overview) | Prefer over list-then-sum |
| Cursor pagination | Borrowers keyset path available | Broader list endpoints still offset/list-based |
| Redis / BullMQ | Optional; in-process fallback | Durable queues need `REDIS_URL` |
| Hot query indexes | Migrations through `0027` / platform `0028` | Journal verified |

---

## Residual scale risks

| ID | Risk | Severity | Remaining action |
|----|------|----------|------------------|
| P26-PERF-01 | Report endpoints still list-based; wide ranges → 422 | Medium | Long-term SQL aggregations / true report queries |
| P26-PERF-02 | No live load / soak evidence on this pack | — | Operator / staging load test if exposure grows |
| P26-PERF-03 | In-process queues under multi-instance | Medium | Provision Redis for production multi-node |

---

## Explicit non-claims

- No p95/p99 latency numbers claimed for production.  
- No claim that fail-closed 422 equals report scalability.  
- Controlled rollout remains appropriate for known staff scale.

**Cross-links:** [DATABASE_AUDIT.md](./DATABASE_AUDIT.md), [FINANCIAL_ENGINE_AUDIT.md](./FINANCIAL_ENGINE_AUDIT.md).
