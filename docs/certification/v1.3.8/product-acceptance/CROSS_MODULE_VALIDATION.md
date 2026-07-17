# Cross-Module Validation — Product Acceptance (v1.3.8)

**Phase:** 21  
**Date:** 17 July 2026  
**Focus:** Event propagation and data flow across the money chain — acceptance lens, not RC re-audit.

---

## 1. Module map

| Chain stage | Backend module | Key routes / services |
|-------------|----------------|----------------------|
| Borrowers / registration | `modules/borrowers/` | `registration-workflow.ts`, `routes.ts` |
| Groups | `modules/groups/` | `service.ts`, `routes.ts` |
| Loan pools | `modules/loan-pools/` | Pool allocations ledger |
| Loans | `modules/loans/` | Create, approve, disburse |
| Admin fee / transactions | `modules/transactions/` | Fee workflow tests |
| Payments | `modules/payments/` | `service.ts`, `payment-reversal.service.ts` |
| Expenses | `modules/expenses/` | `getExpenseSummary()` feeds dashboard |
| Reconciliation | `modules/reconciliation/` | Collector submit → admin review |
| Reports | `modules/reports/` | Ledger, portfolio, daily collection |
| Audit | `modules/audit/` | Immutable append log |
| Collector portal | `modules/collector-portal/` | `access.ts` scoped borrowers |
| Dashboard | `modules/dashboard/` | `financial-overview.ts`, `service.ts` |
| Ops | `modules/ops/` | Health + financial snapshot |

Supporting modules (not in money chain but integrated): `settings/`, `notifications/`, `communications/`, `sync/`, `health/`.

---

## 2. Cross-module flows validated

### 2.1 Registration → approval → active borrower

```
borrowers (PENDING) → approver queue → borrowers (APPROVED)
```

- Workflow status derived in `registration-workflow.ts` without extra tables.
- Approver permissions: `APPROVE_BORROWERS` only on approver role (`role-permissions.ts`).
- **Acceptance:** IDOR fixes in v1.3.8 (`CHANGELOG.md`) — registration delete and reviewed-list scoped by role.

### 2.2 Group → pool → loan → allocation

```
groups (membership) → loan-pools (capital) → loans (create links pool) → pool_allocations DISBURSEMENT
```

- Migrations `0024_v137_rc3_pool_loan_linkage.sql`, `0025_v137_rc3_pool_allocations_backfill.sql` backfill historical linkage.
- `computeLoanPortfolioTotals` in `apps/backend/src/domain/loan-pool/portfolio-totals.ts` reconciles dashboard when allocations lag.
- **Acceptance:** Disburse invalidates loan-pool queries (frontend, `CHANGELOG.md`); utilisation KPI non-zero after disburse.

### 2.3 Disburse → admin fee → collections

```
loans (DISBURSED) → transactions (admin fee) → payments (REPAYMENT) → pool_allocations
```

- Admin fee workflow test: `apps/backend/src/tests/transactions/admin-fee-workflow.test.ts`.
- Payment rules: no partial/advance per BRD; enforced in payment service + frontend validators (`payment-entry.utils.test.ts`).
- **Acceptance:** Collector notified on borrower loan disburse (`CHANGELOG.md` § 1.3.8 Fixed).

### 2.4 Collections + expenses → dashboard + ops

```
payments SUM → buildDashboardFinancialOverview()
expenses getExpenseSummary() → net collections after expenses
ops/service.ts → same buildDashboardFinancialOverview() for /ops snapshot
```

- Single builder: `apps/backend/src/modules/dashboard/financial-overview.ts` (`buildDashboardFinancialOverview`).
- Frontend production path: `apps/frontend/src/services/dashboardService.ts` → `GET /dashboard/summary` only (no client KPI recompute).
- Mock path may recompute: `apps/frontend/src/services/mock/dashboardService.mock.ts` — blocked in production via `next.config.mjs`.
- **Acceptance:** Dashboard SoT is server-side; ops financial panel uses identical builder (`ops/service.ts` line 6, 219).

### 2.5 Reconciliation → reports → audit

```
collector reconciliation submit → Super Admin review (ACCESS_ADMIN_PORTAL)
→ reports/financial-ledger, reports/daily-collection
→ audit entries on sensitive mutations
```

- Recon review route: `reconciliation/routes.ts` `requirePermission(ACCESS_ADMIN_PORTAL)`.
- Audit immutability: no delete endpoints in `audit/routes.ts`; BRD §13.2 aligned.
- **Acceptance:** Recon history IDOR fixed in Phase 19 RC; not re-tested here — cross-reference `rc-validation/CROSS_MODULE_VALIDATION.md`.

### 2.6 Offline sync cross-cut

```
collector offline batch → sync/routes.ts → approver/sync-conflicts → payments post
```

- Financial offline mutations require approver before posting (`docs/security-guide.md`).
- **Acceptance:** Sync constants tested `apps/backend/src/tests/sync/sync.constants.test.ts`.

---

## 3. Request correlation (observability cross-cut)

| Layer | Mechanism | Path |
|-------|-----------|------|
| BFF proxy | Forwards `X-Request-Id` | `apps/frontend/src/tests/lib/api-proxy-headers.test.ts` |
| API | Structured logs with request id | `apps/backend/src/tests/ops/request-id.test.ts` |
| Ops | Surfaces deployment + health | `apps/backend/src/modules/ops/service.ts` |

**Acceptance:** Phase 20 ops dashboard consumes health report from `health/health.service.ts` including migration/schema status.

---

## 4. Permission boundaries across modules

| Cross-module action | Enforced permission | Module |
|---------------------|---------------------|--------|
| Record payment | `RECORD_COLLECTIONS` | `payments/routes.ts` |
| Submit reconciliation | `RECORD_COLLECTIONS` | `reconciliation/routes.ts` |
| Review reconciliation | `ACCESS_ADMIN_PORTAL` | `reconciliation/routes.ts` |
| Ops status | `ACCESS_ADMIN_PORTAL` | `ops/routes.ts` |
| View audit | `VIEW_AUDIT_LOG` / `VIEW_REPORTS` | `audit/`, `reports/` |

Express `requirePermission` (`apps/backend/src/middleware/require-permission.ts`) is authoritative; UI `PermissionGate` is cosmetic (`PermissionGate.tsx` returns children if no context).

---

## 5. Integration matrix (acceptance summary)

| From → To | Propagation | Status |
|-----------|-------------|--------|
| Borrower approve → loan eligible | Status gate on loan create | ✅ |
| Loan disburse → pool allocation | `DISBURSEMENT` ledger row | ✅ |
| Payment → pool `REPAYMENT` | Payment service + allocations | ✅ |
| Expense → dashboard cash out | `getExpenseSummary` in financial overview | ✅ |
| Settings → schedule/grace | `settings/service.ts` → lending calculators | ✅ |
| Notification → communication center | `notifications/`, `communications/` | ✅ (in-process delivery) |
| Health → ops surfaces | `buildHealthReport` → `buildSurfaces` | ✅ |

---

## 6. Residual cross-module risks

| Risk | Modules affected | Mitigation / condition |
|------|------------------|------------------------|
| API restart drops queued mail/SMS | `notifications/`, `communications/scheduler.ts` | Accepted v1.3.8; v1.4 queues |
| Multi-instance unsafe workers | ops `workers.queue: in_process` | Single Railway instance assumption |
| Staging not exercised end-to-end | All | **Condition:** file smoke evidence |
| Migration 0027 not on env | DB indexes for hot queries | **Condition:** apply before prod |

---

## 7. Sign-off

Cross-module money chain propagation is **accepted** for v1.3.8 product delivery. Deep invariant proofs remain in `docs/certification/v1.3.8/rc-validation/SYSTEM_INTEGRITY_REPORT.md`; this document confirms **business-observable** integration only.
