# Dashboard Metrics Update

**Product version:** 1.8.0  
**Scope:** Expected collections on collector and Super Admin surfaces when payable weeks include arrears  
**Language:** British English  
**Status:** Metrics specification

---

## Purpose

Align dashboard **expected** cash figures with schedule-backed payable weeks so multi-week catch-up and arrears are visible. Expected must not assume a single weekly installment when more than one week is payable.

Related: `PAYMENT_ALLOCATION_DESIGN.md`, `REPORTING_UPDATE.md`, `COLLECTOR_PAYMENT_ARCHITECTURE_REVIEW.md`.

---

## Expected definition

| Term | Definition |
|------|------------|
| **Expected (borrower / loan)** | Sum of installment amounts for all **payable** schedule weeks as of the reference date |
| **Payable week** | `MISSED`, or `PENDING` with `dueDate ≤ referenceDate` (same rule as allocation) |
| **Weekly installment** | Loan installment amount (display / single-week pay action) — distinct from expected when `payableWeeksCount > 1` |
| **Collected** | Sum of confirmed payments in the dashboard window (unchanged semantics) |

Formal equality:

`expectedPesewas = Σ installmentPesewas(w) for w ∈ payableWeeks(loan, referenceDate)`

Equivalently when installments are uniform:

`expectedPesewas = payableWeeksCount × weeklyPaymentPesewas`

---

## Collector surfaces

| Surface | Expected behaviour |
|---------|-------------------|
| Collector portal / group list | Per-borrower `expectedPesewas` from payable week sum; expose `payableWeeksCount` |
| Collection sheet | Show catch-up obligation (N weeks) when arrears exist; pay actions use matching `weeksCount` |
| Payment entry context | Obligation weeks and required amount reflect payable set after grace refresh |
| Collector dashboard totals | Aggregate expected = sum of borrower/loan expected figures (not headcount × one week) |

Implementation anchor: collector portal aggregates payable weeks via `listPayableScheduleWeeksForLoans` and accumulates `expectedPesewas` / `weeksCount` per loan (`packages/domain/src/modules/collector-portal/service.ts`).

---

## Super Admin surfaces

| Surface | Expected behaviour |
|---------|-------------------|
| Operations / collections overview | Programme expected cash uses the same payable-week sum within the selected scope and date |
| Group / loan drill-down | Arrears visible as elevated expected vs single weekly installment |
| Reconciliation-adjacent widgets | Prefer schedule dues / payable logic over payment-day-only heuristics when schedule rows exist |

Where Super Admin views still show a single “weekly due”, label them as **weekly installment**, not **expected due**, if payable count may exceed one.

---

## Status and variance cues

| Signal | Use |
|--------|-----|
| `payableWeeksCount` | Distinguish current week vs catch-up |
| `hasMissed` / schedule `MISSED` | Highlight arrears in lists |
| Expected − collected | Collection progress for the reference context |
| Escalation level (optional) | Due / Grace / Overdue / Escalated from grace helper — display only; does not change expected math |

---

## Anti-patterns (do not ship)

| Anti-pattern | Why |
|--------------|-----|
| `expectedPesewas = weeklyPaymentPesewas` always | Understates arrears catch-up |
| Counting only weeks due **exactly** on reference date | Misses older `MISSED` / past-due payable weeks |
| Inflating expected by N after payment already cleared those weeks | Payable set must be current after allocation |
| Divergent formulas between collector and Super Admin | Breaks operational trust |

---

## Acceptance checks

| # | Check |
|---|--------|
| 1 | Borrower with 3 payable weeks and weekly ₵50 shows expected ₵150 |
| 2 | After paying `weeksCount = 2`, expected for remaining payable week is ₵50 |
| 3 | Collector total expected equals sum of row expected values |
| 4 | Super Admin scoped total uses the same payable-sum rule for the same date and loan set |

---

## Source of truth

| Area | Path |
|------|------|
| Collector portal expected | `packages/domain/src/modules/collector-portal/service.ts` |
| Payable / allocation rules | `packages/domain/src/domain/payment/allocation.ts` |
| Recon expected (day dues) | `packages/domain/src/domain/reconciliation/expected-cash.ts` (schedule-first; align with payable-sum where product requires arrears in “expected”) |

---

*End of dashboard metrics update — WILMS 1.8.0*
