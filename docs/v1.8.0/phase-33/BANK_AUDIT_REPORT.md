# Phase 33 — Bank / Financial Integrity Audit

**Identity:** WILMS v1.8.0  
**Scope:** Code review + domain unit/integration (no authenticated production mutations)  
**Evidence:** `evidence/phase33-adversarial-tests.log`

## Executive result

Confirmed financial control gaps in expense create and admin-fee record (missing idempotency), and a pool hard-stop TOCTOU race on disbursement, were reproduced in code and remediated with regression tests. Posted payment immutability (409) remains enforced.

## Findings

| ID | Severity | Status | Summary |
|----|----------|--------|---------|
| H1 | **High** | Remediated | `POST /expenses` and `POST /transactions/admin-fee` lacked `runWithIdempotency` → double-submit risk |
| H2 | **High** | Remediated | Disburse hard-stop read pool without row lock → concurrent over-allocation risk |
| H5 | Medium (docs) / Info (API) | Docs fixed | Manuals claimed same-day payment edit; API returns 409 immutable |
| H6 | Info (residual) | Open residual | Offline sync SoD covered by existing suites; no new confirmed bypass |
| H9 | Info | Residual | Maker-checker SoD suites remain green; no new self-approve gap proven |
| H10 | Info | Residual | Pool aggregate formula consistent in unit check; no dashboard/report formula defect proven |

## Remediations

1. Migration `0040_v180_phase33_idempotency_scopes.sql` adds `EXPENSE_CREATE`, `ADMIN_FEE_RECORD`.
2. Expense/admin-fee services wrap creates with `runWithIdempotency`; routes read `Idempotency-Key`.
3. Frontend `expenseService` / `transactionService` use `financialMutation` headers.
4. `findPoolByIdForUpdate` + disbursement path lock before capital hard-stop.

## Tests

- `packages/domain/src/tests/phase33/expense-admin-fee-idempotency-wiring.test.ts`
- `packages/domain/src/tests/phase33/adversarial-remediation.test.ts` (H1/H2/H10)
- `packages/domain/src/tests/phase33/payment-immutability.test.ts` (H5 API contract)
- Existing: `financial-integrity-p0`, `financial-endpoints-rbac`, `sod-*.test.ts`, sync SoD

## Residual risk

Neon must apply migration **0040** before production relies on the new enum values. Without the migration, inserts into `idempotency_keys` with new scopes will fail at the database.
