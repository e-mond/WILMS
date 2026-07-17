# WILMS v1.3.8 — Enterprise Financial Remediation

**Engagement:** External enterprise audit remediation  
**Branch:** `cursor/v138-enterprise-financial-8847`  
**Date:** 17 July 2026  
**Source audit:** `docs/certification/v1.3.8/EXTERNAL_ENTERPRISE_AUDIT.md` (audit branch)

## Scope

Close every **Critical** and **High** finding with **backend-enforced** controls. UI checks are not accepted as financial controls.

## Finding closure matrix

| ID | Severity | Finding | Remediation | Status |
|---|---|---|---|---|
| C-01 | Critical | Admin fee not enforced on API | `assertAdminFeeRecorded` on create / approve / disburse / eligibility | **Resolved** |
| C-02 | Critical | Approval optional on happy path | Loans insert as `PENDING_APPROVAL`; disburse requires `lifecycleStatus === PENDING_DISBURSEMENT` | **Resolved** |
| C-03 | Critical | Expenses recorded not deducted | Expense create posts `ADJUSTMENT` operating-cash ledger + audit; dashboard `netOperatingCash` deducts expenses (never principal/pool) | **Resolved** |
| C-04 | Critical | Reversal leaves pools dirty | Reversal appends negative `REPAYMENT` pool allocation + `refreshPoolAggregates`; progress nets `REVERSAL` | **Resolved** |
| C-05 | Critical | Holiday collection deadlock | Payment day accepts assigned weekday **or** holiday-shifted due date | **Resolved** |
| H-01 | High | Recon collectorId IDOR | Collectors forced to `session.userId` on get/list/submit | **Resolved** |
| H-02 | High | Payment assignment gap | Collectors must pass `assertBorrowerReadAccess` before `POST /payments` | **Resolved** |
| H-03 | High | Auditor can review recon | Review gated by `ACCESS_ADMIN_PORTAL` (Auditor lacks it) | **Resolved** |
| H-04 | High | Collector `MANAGE_GROUPS` | Removed from `@wilms/shared-rbac` and frontend role defs | **Resolved** |
| H-05 | High | Zero-due auto-approve | Flag when `expectedDue=0` and cash ≠ 0; flag physical≠system; absolute floor 100 pesewas | **Resolved** |
| H-06 | High | Fixed invite password | `generateInvitePassword()` per invite/resend/onboard | **Resolved** |
| H-07 | High | Pool capital soft | Disburse fails when `amount > capital − outstanding` | **Resolved** |
| H-08 | High | Dashboard disagreement | Financial overview prefers pool aggregates; excludes reversed payments; week-over-week collection rate; no capital double-count | **Resolved** |
| H-09 | High | Payment PATCH theatre | `PATCH /payments/:id` returns **409** immutable; UI directs to reverse/adjustment | **Resolved** |
| H-10 | High | Recon resubmit lock | `REJECTED` / `REOPENED` supersede with history trail | **Resolved** |

## Medium / operational (tracked, not blocking Critical/High)

| ID | Classification | Notes |
|---|---|---|
| M-01 | Residual risk | Idempotency-Key still optional on some money POSTs — recommend require in next sprint |
| M-13 | Infrastructure | In-process queues / HTTP-triggered scheduler — durable Redis/BullMQ recommended |
| M-14 | Mitigated | Health uses watermark for pending migrations; exposes `migrations.countGap` when row count ≠ journal length |

## Verification

- Backend: `src/tests/enterprise/financial-integrity-p0.test.ts`
- Domain: reconciliation variance, payment allocation, health watermark
- Frontend: PaymentEditSection immutable ledger UX

## Verdict for this remediation

**Critical and High findings from the external enterprise audit are closed in code on this branch.**

Full “Enterprise Production Ready” certification requires deploy of this branch, production smoke of loan→fee→approve→disburse→collect→reverse→expense→dashboard, and independent re-verification (see `FINAL_ENTERPRISE_CERTIFICATION.md`).
