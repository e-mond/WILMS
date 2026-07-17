# Data Integrity Report — Product Acceptance (v1.3.8)

**Phase:** 21  
**Date:** 17 July 2026  
**Focus:** Financial data lineage, schema integrity, audit immutability.

---

## 1. Financial source of truth

### 1.1 Executive dashboard

| Concern | Authority | Path |
|---------|-----------|------|
| KPI builder | `buildDashboardFinancialOverview()` | `apps/backend/src/modules/dashboard/financial-overview.ts` |
| API endpoint | `GET /dashboard/summary` | `apps/backend/src/modules/dashboard/routes.ts`, `service.ts` |
| Frontend consumption | `dashboardService.getDashboardSummary()` only | `apps/frontend/src/services/dashboardService.ts` |
| Mock recompute | `dashboardService.mock.ts` | Dev only; production forces API (`next.config.mjs`) |
| Ops snapshot | Same builder | `apps/backend/src/modules/ops/service.ts` |

**Finding:** No production code path recomputes live KPIs on the client. `useDashboardSummary` hook delegates to service (`features/super-admin-dashboard/hooks/useDashboardSummary.ts`).

### 1.2 Documented formulas

`docs/financial-calculations.md` (v1.3.8):

- Pool ledger: `pool_allocations` types `REPLENISHMENT`, `DISBURSEMENT`, `REPAYMENT`, `ADJUSTMENT`
- Dashboard merges pool aggregates with `computeLoanPortfolioTotals` when allocations lag
- Expenses reduce net collections via `getExpenseSummary()`

**Explicit limitation:** No statutory double-entry GL — operational ledger only. Roadmap: `docs/certification/v1.3.8/enterprise-architecture/DOUBLE_ENTRY_LEDGER_MIGRATION_ROADMAP.md`.

---

## 2. Money storage and derivation

| Rule | Implementation |
|------|----------------|
| Amounts in pesewas | `decimalToPesewas` in `apps/backend/src/domain/money.ts` |
| No manual balance fields | Balances derived from transaction sums (BRD §11.1) |
| Payment ordering | Oldest obligation first (payment service) |
| Overpayment blocked | `overpayment-reviews/` module |
| Reversals audited | `payment-reversal.service.ts` |

Tests: `admin-fee-workflow.test.ts`, `paymentService.edit.test.ts`, `overpaymentReviewService.mock.test.ts`

---

## 3. Schema and migrations

| Item | Value | Path |
|------|-------|------|
| Journal entries | **28** (idx 0–27) | `apps/backend/src/db/migrations/meta/_journal.json` |
| Latest migration | `0027_hot_query_indexes` | `apps/backend/src/db/migrations/0027_hot_query_indexes.sql` |
| Verify script | `npm run verify:migrations` | `apps/backend/src/verification/verify-migration-journal.ts` |
| Health check | `migrations.status`, `schema.status` | `apps/backend/src/modules/health/health.service.ts` |

### Launch condition: migration 0027

All environments promoting v1.3.8 must apply `0027_hot_query_indexes` so applied count equals journal length. Health endpoint surfaces degradation when counts diverge (documented in `health.service.ts` comments).

Historical repair: `0026_v137_prod_schema_repair.sql` — one-time prod repair; do not re-run without recovery plan (`production-guide.md`).

---

## 4. Pool–loan linkage integrity

| Migration | Purpose |
|-----------|---------|
| `0024_v137_rc3_pool_loan_linkage` | Link loans to pools via group membership |
| `0025_v137_rc3_pool_allocations_backfill` | Backfill `loan_pool_id` and allocation history |

**Acceptance:** v1.3.7-rc3 blocking fixes documented in `CHANGELOG.md`; KPI zeros remediated.

---

## 5. Audit trail

| Property | Evidence |
|----------|----------|
| Append-only | No delete routes in `modules/audit/routes.ts` |
| Sensitive actions logged | Payments, adjustments, user lifecycle, recon review |
| Auditor read access | `VIEW_AUDIT_LOG` on auditor role |
| Super Admin full history | `VIEW_AUDIT_HISTORY` |

BRD §13.2 immutability: **accepted** at API design level.

---

## 6. Reconciliation lifecycle

| State | Actor | Module |
|-------|-------|--------|
| Submitted / Pending | Collector | `reconciliation/service.ts` |
| Approved / Rejected | Super Admin | Review routes with `ACCESS_ADMIN_PORTAL` |

Status labelling fixed v1.3.8: **Pending** until admin action (`CHANGELOG.md`).

---

## 7. IDOR and data scope (v1.3.8 remediated)

Per `CHANGELOG.md` § 1.3.8 Security — accepted as closed in code:

- Messaging thread `adminId` scope
- Registration delete `officerId` scope
- Approver reviewed-list scope
- Payment reversal actor attribution

Deep review reference: `docs/certification/v1.3.8/enterprise-financial/IDOR_REVIEW.md` (not re-audited here).

---

## 8. Backup and recovery data posture

| Item | Status |
|------|--------|
| Provider | Neon (external managed) — `ops/service.ts` `backups.provider: 'neon'` |
| PITR restore test evidence | **Not filed** — launch condition |
| Runbook | `docs/certification/v1.3.8/production-operations/BACKUP_AND_RECOVERY_PLAN.md` |

---

## 9. Data integrity score

**Financial Integrity: 88/100** — see [LAUNCH_READINESS_SCORECARD.md](./LAUNCH_READINESS_SCORECARD.md)

Deductions: no statutory GL (−6), staging E2E evidence pending (−4), backup restore not evidenced (−2).

---

## 10. Sign-off

| Area | Verdict |
|------|---------|
| Dashboard SoT | ✅ Accepted |
| Pool ledger model | ✅ Accepted |
| Migration journal | ⚠ Apply 0027 on all envs |
| Audit immutability | ✅ Accepted |
| Backup evidence | ⚠ Condition |

**Overall data integrity:** ✅ **Accepted with conditions** listed in [PRODUCT_ACCEPTANCE_REPORT.md](./PRODUCT_ACCEPTANCE_REPORT.md).
