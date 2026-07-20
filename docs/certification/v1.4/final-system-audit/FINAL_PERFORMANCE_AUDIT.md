# Final Performance Audit — WILMS v1.4.1

**Date:** 2026-07-20  
**Live load test evidence in repo:** **None** — **Not verified**

---

## Verdict

Performance is **acceptable for controlled operational rollout** at current programme scale, with known list/report ceilings. This pack does **not** certify high-concurrency or large-history workloads.

---

## Verified mitigations (this branch / platform)

| Item | Status | Evidence |
|------|--------|----------|
| Money reports fail closed instead of silently truncating at 2000 rows | **Verified** | `reports/routes.ts` → HTTP 422 |
| Dashboard financial KPIs use SQL aggregates (not capped list) | **Verified** | `dashboard/financial-overview.ts` |
| Bundle / perf budget scripts exist | **Verified** | `npm run bundle:budget-check`, `perf:budget-check` |
| Hot-query indexes (prior migrations) | Carry-forward | Journal includes prior hot-query migration |

---

## Residuals

| Risk | Impact | Mitigation today | Long-term |
|------|--------|------------------|-----------|
| List-then-aggregate report paths | Understatement or 422 under large datasets | 422 refusal | SQL aggregations + pagination/export |
| `listPayments` default cap | Incomplete lookups (`getPaymentById` edge) | Documented residual | Direct-by-id query |
| No Redis under load | Queue falls back in-process | Documented Phase 25 | Operator Redis |
| No live load test | Unknown p95 under real traffic | Controlled rollout + monitoring | Formal load test |

---

## What was not run

- k6 / Artillery / Locust (or equivalent) against staging/production — **Not verified**  
- Production p95/p99 capture for money endpoints — **Pending operator**  
- Concurrent collector payment storm — **Not verified**

Do not invent latency numbers. Attach evidence when operators run budgets against a real environment.

---

## Related

- [FINAL_FINANCIAL_INTEGRITY_AUDIT.md](./FINAL_FINANCIAL_INTEGRITY_AUDIT.md)  
- Phase 25: `../phase-25/V1.4_PERFORMANCE_REPORT.md`  
- [PRODUCTION_ROLLOUT_RUNBOOK.md](../../../PRODUCTION_ROLLOUT_RUNBOOK.md)
