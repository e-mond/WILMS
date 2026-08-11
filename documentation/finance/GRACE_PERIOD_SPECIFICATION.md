# Grace Period Specification

**Product version:** 1.8.0  
**Scope:** Late-payment grace, schedule missed marking, and escalation levels  
**Language:** British English  
**Status:** Product / domain specification

---

## Purpose

Define how WILMS treats a repayment week between its due date and automatic missed marking, and how UI / domain levels map to **Due**, **Grace**, **Overdue**, and **Escalated**.

Related: `PAYMENT_ALLOCATION_DESIGN.md`, `NOTIFICATION_ESCALATION_SPECIFICATION.md`.

---

## Setting

| Setting key | Default | Storage | Configurable |
|-------------|---------|---------|--------------|
| `latePaymentGraceDays` | **3** | System settings (`late_payment_grace_days`) | Yes — Super Admin Settings (`PATCH /settings`) |

Grace is measured in **calendar days after the week’s `dueDate`**. Changing the setting applies to subsequent missed-marking and escalation evaluations; it does not rewrite historical payment rows.

---

## Missed-week threshold

`applyMissedWeekMarking(loanId, referenceDate, graceDays)`:

- Considers only weeks with status `PENDING`
- Computes `missedThreshold = dueDate + graceDays`
- Marks the week `MISSED` when `missedThreshold < referenceDate`

With default grace **3**:

| Due date | Earliest `referenceDate` that auto-marks `MISSED` |
|----------|-----------------------------------------------------|
| 2026-08-10 | 2026-08-14 (`dueDate + 3` is 2026-08-13; mark when reference is after that) |

Until that threshold, the week may still be `PENDING` and payable (if `dueDate ≤ referenceDate`). Collector-initiated `markMissedPayment` may set `MISSED` earlier as an explicit schedule event (not a payment).

---

## Escalation levels

Domain helper `computeGraceAndEscalation` returns:

| Level | Condition (relative to oldest payable due date) |
|-------|--------------------------------------------------|
| `NONE` | No payable due date |
| `DUE` | `daysPastDue ≤ 0` (on or before due; typically due day) |
| `GRACE` | `1 ≤ daysPastDue ≤ latePaymentGraceDays` |
| `OVERDUE` | `latePaymentGraceDays < daysPastDue ≤ latePaymentGraceDays + 3` |
| `ESCALATED` | `daysPastDue > latePaymentGraceDays + 3` |

Also returned: `daysPastDue`, `gracePeriodEnd` (`dueDate + graceDays`).

**Default timeline (grace = 3)**

| Day relative to due (T) | Typical level |
|-------------------------|---------------|
| T | `DUE` |
| T+1 … T+3 | `GRACE` |
| T+4 … T+6 | `OVERDUE` |
| T+7 and beyond | `ESCALATED` |

Notification ladder timing (borrower / collector / Super Admin alerts) is specified separately in `NOTIFICATION_ESCALATION_SPECIFICATION.md` and may fire on specific day offsets (e.g. T+grace, T+grace+1) without changing these level labels.

---

## Product semantics

| State | Meaning for operations |
|-------|------------------------|
| **Due** | Obligation is due today (or due date reached); still within collection norms |
| **Grace** | Past due but within configured grace; not yet auto-`MISSED` |
| **Overdue** | Past grace window for level purposes; schedule may already be `MISSED` |
| **Escalated** | Prolonged delinquency; elevated operational attention |

Payable status is independent of level: both `PENDING` (due) and `MISSED` weeks remain payable and are cleared oldest-first on payment.

---

## Where grace is applied

| Call site | Role |
|-----------|------|
| `getPaymentEntryContext` | Refresh missed marking before showing obligations |
| `recordPayment` | Refresh before validate / allocate |
| Payment notification scheduler | Batch `applyMissedWeekMarking` for active loans |
| Loan schedule reads (selected paths) | Keep schedule status current for field views |

---

## Configuration guidance

| Guidance | Detail |
|----------|--------|
| Default | Keep **3** unless programme policy requires otherwise |
| Lower values | Faster auto-`MISSED` and earlier ladder steps tied to grace |
| Higher values | Longer borrower grace; delays auto-missed and grace-relative notifications |
| Alignment | Notification copy and dashboard badges should use the same setting value |

---

## Source of truth

| Area | Path |
|------|------|
| Settings default | `packages/domain/src/modules/settings/settings-mapper.ts` |
| Schema column | `packages/domain/src/db/schema/system-settings.ts` |
| Missed marking | `packages/domain/src/repositories/loan-schedule.repository.ts` |
| Level helper | `packages/domain/src/domain/payment/allocation.ts` (`computeGraceAndEscalation`) |

---

*End of grace period specification — WILMS 1.8.0*
