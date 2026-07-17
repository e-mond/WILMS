# Business Workflow Validation — WILMS v1.3.8

**Phase:** 21 — Product Acceptance  
**Date:** 17 July 2026  
**Method:** Role-based workflow trace against backend modules and frontend routes (evidence paths cited).

---

## 1. Canonical money chain

```
Registration → Approval → Groups → Loan Pools → Loan create → Admin fee → Approve → Disburse
    → Collections → Expenses → Reconciliation → Reports → Audit
```

Each stage maps to committed backend modules and staff UI routes. **Borrowers do not log in**; they are entities in `apps/backend/src/modules/borrowers/` managed by Registration Officers, Approvers, and Collectors.

---

## 2. Workflow validation by stage

### 2.1 Registration

| Step | Actor | Backend | Frontend | Evidence |
|------|-------|---------|----------|----------|
| Capture borrower | Registration Officer | `borrowers/service.ts`, `registration-workflow.ts` | `/officer/register` | `apps/frontend/src/app/(registration-officer)/officer/register/page.tsx` |
| Track submissions | Registration Officer | `borrowers/routes.ts` | `/officer/my-registrations` | Status resolver in `registration-workflow.ts` (`PENDING` → `SUBMITTED` / `UNDER_REVIEW`) |
| Document capture | Officer / Collector | `uploads/`, `photo-capture/` | Registration + collector flows | `PERMISSION.CAPTURE_DOCUMENTS` in `role-permissions.ts` |

**Acceptance:** Registration workflow states are deterministic from borrower status + `registeredAt`. Officer nav: 3 items in `REGISTRATION_OFFICER_NAV`.

### 2.2 Approval (borrower + loan)

| Step | Actor | Backend | Frontend |
|------|-------|---------|----------|
| Pending queue | Approver | `borrowers/`, `loans/` | `/approver/pending` |
| Offline sync review | Approver | `sync/service.ts` | `/approver/sync-conflicts` |
| Reviewed history | Approver | audit + list filters | `/approver/reviewed` |
| Approve/reject borrower | Approver | `PERMISSION.APPROVE_BORROWERS` | Pending detail `[id]/page.tsx` |
| Approve/reject loan | Approver | `PERMISSION.APPROVE_LOANS` | Same queue |

**Acceptance:** Approver lacks `access-admin-portal`; cannot mutate reconciliation or system settings. SoD preserved.

### 2.3 Groups and loan pools

| Step | Actor | Backend | Frontend |
|------|-------|---------|----------|
| Manage groups | Super Admin only | `groups/service.ts` | `/groups`, `/groups/[id]` |
| Loan pools | Super Admin | `loan-pools/service.ts` | `/loan-pools` |
| Pool–group linkage | Super Admin | migrations `0024`, `0025` | Create wizard + pool aside |

**Acceptance:** Collector **does not** have `MANAGE_GROUPS` (`role-permissions.ts` line 11–14 comment). Group assignment is admin function.

### 2.4 Loan origination and disbursement

| Step | Actor | Backend | Frontend |
|------|-------|---------|----------|
| Create loan | Super Admin | `loans/service.ts` | `/loans/new`, `/borrowers/[id]/loan` |
| Admin fee | Collector | `transactions/`, collector portal | `/collector/admin-fee` |
| Disburse | Super Admin | pool allocations `DISBURSEMENT` | `/loans`, `/loans/[id]` |

**Acceptance:** `docs/financial-calculations.md` documents admin fee before disbursement (BRD §6). Test: `apps/backend/src/tests/transactions/admin-fee-workflow.test.ts`.

### 2.5 Collections and expenses

| Step | Actor | Backend | Frontend |
|------|-------|---------|----------|
| Record payment | Collector | `payments/service.ts` | `/collector/payment/[id]`, collection sheet |
| Same-day edit | Collector | `payment-reversal.service.ts` | `PaymentEditSection.tsx` + `PermissionGate` |
| Record expense | Collector | `expenses/service.ts` | `/collector/expenses` |
| Expense oversight | Super Admin | `expenses/routes.ts` | `/expenses` |

**Acceptance:** Collectors can view own expense history (v1.3.8 fix per `CHANGELOG.md`). GPS and duplicate-payment rules enforced in payment service layer.

### 2.6 Reconciliation

| Step | Actor | Backend | Frontend |
|------|-------|---------|----------|
| Submit recon | Collector | `reconciliation/service.ts` | `/collector/reconciliation` |
| Review flagged variance | Super Admin | `requirePermission(ACCESS_ADMIN_PORTAL)` on review routes | Super Admin reports + `/ops` financial snapshot |

**Acceptance:** Status lifecycle `Pending` until Super Admin action (`CHANGELOG.md` § 1.3.8). Recon routes in `reconciliation/routes.ts`.

### 2.7 Reports and audit

| Step | Actor | Backend | Frontend |
|------|-------|---------|----------|
| Operational reports | Super Admin, Auditor | `reports/routes.ts` | `/reports/*`, `/auditor/reports` |
| Audit log | Super Admin, Auditor | `audit/routes.ts` | `/reports/audit-log`, `/auditor/audit-log` |
| Export | Auditor | `PERMISSION.EXPORT_REPORTS` | Report panels + `features/export/` |

**Acceptance:** Auditor has read-only report access; no `access-admin-portal` per `docs/permission-matrix.md` SoD notes.

---

## 3. Role portal validation

| Role | Portal home | Nav count | All hrefs resolve |
|------|-------------|-----------|-------------------|
| Super Admin | `/dashboard` | 15 | ✅ `SUPER_ADMIN_NAV` including `/ops` |
| Collector | `/collector/dashboard` | 7 | ✅ `COLLECTOR_NAV` |
| Registration Officer | `/officer/register` | 3 | ✅ `REGISTRATION_OFFICER_NAV` |
| Approver | `/approver/pending` | 4 | ✅ `APPROVER_NAV` |
| Auditor | `/auditor/reports` | 3 | ✅ `AUDITOR_NAV` |

**Total:** 32 nav hrefs (including query-variant `/borrowers?status=PENDING` → same `borrowers/page.tsx`).

Demo credentials for workflow rehearsal: `apps/backend/src/seed/demo-users.ts` (`@wilms.demo` accounts per role).

---

## 4. Product tour and onboarding

| Item | Path | Acceptance |
|------|------|------------|
| Tour routes per role | `apps/frontend/src/tests/onboarding/product-tour-routes.test.ts` | Deep-links match live nav |
| Expenses step fix | `CHANGELOG.md` | No 404 to removed `/settings/expenses` |
| Mandatory welcome | Product tour flow | Guides first-time staff per role |

---

## 5. Workflow gaps (accepted limitations)

| Gap | Impact | Roadmap / condition |
|-----|--------|---------------------|
| No borrower self-service | Borrowers cannot check balance online | Product boundary — by design |
| Offline payments need approver | Field collector queues to sync | `/approver/sync-conflicts` |
| No statutory GL | Finance team cannot run trial balance in WILMS | v1.4+ double-entry roadmap |
| In-process notification queue | Restart may drop in-flight mail/SMS | v1.4 Redis/BullMQ |

---

## 6. Workflow sign-off

| Workflow segment | Status | Blocker |
|------------------|--------|---------|
| Registration → approval | ✅ Accepted | None |
| Groups / pools → loan → disburse | ✅ Accepted | Apply migration 0027 on target DB |
| Admin fee → collections | ✅ Accepted | None |
| Expenses → reconciliation | ✅ Accepted | Staging E2E evidence pending |
| Reports → audit | ✅ Accepted | None |

**Overall business workflow:** ✅ **Accepted** for staff-operated programme delivery, subject to launch conditions in [PRODUCT_ACCEPTANCE_REPORT.md](./PRODUCT_ACCEPTANCE_REPORT.md).
