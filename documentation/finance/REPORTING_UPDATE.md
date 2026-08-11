# Reporting Update

**Product version:** 1.8.0  
**Scope:** Expected collections in reports (including arrears) and multi-week allocation integrity  
**Language:** British English  
**Status:** Reporting specification

---

## Purpose

Ensure financial and operational reports treat **expected** collections as schedule-backed obligations (including arrears), and that multi-week catch-up payments allocate correctly without double-counting or under-counting weeks.

Related: `DASHBOARD_METRICS_UPDATE.md`, `PAYMENT_ALLOCATION_DESIGN.md`.

---

## Expected includes arrears

| Principle | Detail |
|-----------|--------|
| Expected ≠ today’s installment only | For a reporting date, expected includes all **payable** weeks still open (past due / missed + due today), not solely the week whose `dueDate` equals the report date |
| Arrears | Older unpaid weeks remain in expected until paid or otherwise closed by product rules |
| Consistency | Report totals must match dashboard expected for the same scope and reference date |

**Illustrative borrower**

| Week | Due | Status on report date | Contribution to expected |
|------|-----|------------------------|--------------------------|
| 30 | prior | `MISSED` | + weekly |
| 31 | prior | `PENDING` (past due) | + weekly |
| 32 | today | `PENDING` | + weekly |
| 33 | future | `PENDING` | 0 (not yet payable) |

Expected = 3 × weekly.

---

## Multi-week allocation in reports

When a collector records `weeksCount = N`:

| Effect | Reporting consequence |
|--------|----------------------|
| N payment rows created | Each row is one weekly installment; reports summing payments count N × weekly once |
| N schedule weeks → `PAID` | Those weeks drop out of subsequent expected / arrears |
| Single action, multiple rows | Do not invent a synthetic “bundle” payment that would double-count if both action metadata and rows are summed |
| Response metadata (`weeksCount`, `weekNumbers`) | Useful for audit trails; cash totals must prefer payment row amounts |

**Integrity rules**

| Rule | Check |
|------|-------|
| Amount integrity | Sum of the N payment rows equals the collector-posted total |
| Schedule integrity | Cleared week numbers match oldest payable set at posting time |
| No residual expected for paid weeks | After commit, paid weeks contribute 0 to expected |
| Reversal (if applicable) | Separate flows; do not reverse only one of N without a defined policy |

---

## Reconciliation alignment

| Formula area | Guidance |
|--------------|----------|
| Schedule dues on recon date | `calculateExpectedDuePesewas` prefers installments due on the recon date, with payment-day fallback — suitable for **day-of** recon |
| Arrears-inclusive expected | Collection performance and arrears reports should use **payable-week sum**, not only same-day schedule dues |
| System recorded | Confirmed payments only; reversed excluded |

Document report type explicitly:

| Report class | Expected basis |
|--------------|----------------|
| Daily reconciliation (cash vs system for the day) | Schedule dues on recon date (+ fallback) |
| Arrears / collection performance | Payable-week sum (includes arrears) |
| Payment registers | Individual payment rows (multi-week = multiple rows) |

---

## Acceptance checks

| # | Check |
|---|--------|
| 1 | Arrears report expected for a loan equals sum of open payable weeks × installment |
| 2 | After multi-week payment of 2 weeks, those week numbers no longer appear in unpaid/arrears extracts |
| 3 | Payment register shows two rows of weekly amount for a `weeksCount = 2` post |
| 4 | Summing payment register for that action equals 2 × weekly |
| 5 | Dashboard expected and arrears report expected agree for the same date and loan set |

---

## Source of truth

| Area | Path |
|------|------|
| Allocation | `packages/domain/src/domain/payment/allocation.ts` |
| Payment posting (N rows) | `packages/domain/src/modules/payments/service.ts` |
| Day recon expected | `packages/domain/src/domain/reconciliation/expected-cash.ts` |
| Collector payable expected | `packages/domain/src/modules/collector-portal/service.ts` |
| Domain tests | `packages/domain/src/tests/payment/multi-week-allocation.test.ts` |

---

*End of reporting update — WILMS 1.8.0*
