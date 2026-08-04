# FINANCIAL ENGINE AUDIT — WILMS

**Audit date:** 2026-07-16  
**Audited code:** `main @ 10dfcbb`  
**Goal:** Validate financial calculations are internally consistent and reconciliations reconcile.

## 1. Canonical financial model (source of truth)

`docs/financial-calculations.md` defines the single-source-of-truth formulas:
- Pool ledger:
  - `disbursed_pesewas = SUM(DISBURSEMENT allocations)`
  - `collected_pesewas = SUM(REPAYMENT allocations)`
  - `outstanding_pesewas = MAX(disbursed − collected, 0)`
  - `available_capital = capital_pesewas − outstanding_pesewas`
- Organisation metrics:
  - `net_collections = MAX(total_collected − expenses, 0)`
  - `net_operating_cash = collections + admin_fees − expenses`

## 2. Code-level verification evidence

Automated unit tests executed locally during this audit:
- Reconciliation variance / expected cash logic
  - `apps/backend/src/tests/reconciliation/domain.test.ts` — PASS
- Variance classification and flagging
  - `variance.ts` — PASS via unit tests
- Financial ledger/report domain tests
  - `apps/backend/src/tests/reports/domain.test.ts` — PASS
- Financial endpoint RBAC audit (authorization for money-moving endpoints)
  - `apps/backend/src/tests/financial/financial-endpoints-rbac.test.ts` — PASS

All backend unit tests completed with success.

## 3. Production data integrity prerequisites (why unit tests are insufficient)

Correctness in production depends on:
- migrations applying the correct schema
- migrations that backfill pool allocation aggregates running successfully
- live dashboard totals reconciling against ledger/report exports

This audit validated schema readiness via `/health`, but did not run the live financial reconciliation workflow end-to-end because production `DATABASE_URL` / operational access for data reconciliation execution was not available inside this environment.

## 4. Financial reconciliation verdict

**PASS (code/model & unit tests).**  
**NOT VERIFIED (live totals reconciliation across modules)** in this environment due to operational access constraints.

