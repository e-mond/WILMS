# Financial Integrity Report — v1.3.7

**Date:** 2026-07-13  
**Priority:** Highest  
**Verdict:** **LOCAL PASS — PRODUCTION NOT VERIFIED**

---

## Model reference

Canonical formulas documented in [docs/financial-calculations.md](../../financial-calculations.md).

```
disbursed_pesewas     = SUM(DISBURSEMENT allocations)
collected_pesewas     = SUM(REPAYMENT allocations)
outstanding_pesewas   = MAX(disbursed − collected, 0)
available_capital     = capital_pesewas − outstanding_pesewas
net_collections       = MAX(total_collected − expenses, 0)
net_operating_cash    = collections + admin_fees − expenses
```

---

## Unit test coverage (executed)

| Area | Tests | Result |
|------|-------|--------|
| Reconciliation variance / expected cash | `reconciliation/domain.test.ts` | PASS |
| Reconciliation review (frontend) | `reconciliation-review.test.ts` | PASS |
| Financial ledger reports | `reports/domain.test.ts` | PASS |
| Financial endpoint RBAC | `financial-endpoints-rbac.test.ts` | PASS |
| Loan pool service | `loan-pools/service.test.ts` | PASS |
| Collector reconciliation mock | `reconciliationService.mock.test.ts` | PASS |

**Backend:** 129/129 PASS  
**Frontend:** 237/237 PASS (includes reconciliation and report utilities)

---

## Migration dependency

v1.3.7 financial KPI accuracy depends on:

| Migration | Purpose |
|-----------|---------|
| `0024_v137_rc3_pool_loan_linkage` | Backfill `loan_pool_id` from group membership |
| `0025_v137_rc3_pool_allocations_backfill` | Backfill `pool_allocations` + refresh aggregates |

**Production status (2026-07-13):** Neither migration confirmed applied. Journal entries for `0024`/`0025` were missing from `_journal.json` and were added in this certification sprint.

---

## Production reconciliation audit

| Check | Status |
|-------|--------|
| Pool capital vs dashboard | **NOT EXECUTED** |
| Disbursed vs loan portfolio | **NOT EXECUTED** |
| Collected vs payments ledger | **NOT EXECUTED** |
| Outstanding vs active loans | **NOT EXECUTED** |
| Expenses vs operating cash | **NOT EXECUTED** |
| Loan pool KPI zeros | **NOT EXECUTED** |
| Export totals vs UI | **NOT EXECUTED** |
| Reconciliation auto-approve balanced | **NOT EXECUTED** |

**Blockers:** Production health degraded; no authenticated API access; `cert:financial:prep` requires `DATABASE_URL`.

---

## Cert scripts

| Script | Result |
|--------|--------|
| `cert:financial:prep` | **BLOCKED** — `DATABASE_URL` not available |
| `cert:reconciliation:*` | **BLOCKED** — requires database |
| `verify:empty-db` | **BLOCKED** — `DATABASE_URL` required |

---

## Findings

| ID | Severity | Finding |
|----|----------|---------|
| FIN-001 | **Critical** | Production migrations behind; pool allocation backfill not confirmed |
| FIN-002 | **High** | Cannot cross-check live dashboard vs ledger without DB access |
| FIN-003 | **Medium** | `0024`/`0025` were not registered in Drizzle journal (fixed in repo) |

---

## Verdict

Financial logic is verified at the unit-test and documentation level. **Live financial reconciliation is not certified** until migrations `0024`–`0025` run on production and a manual audit confirms dashboard, pools, collections, expenses, and exports agree.
