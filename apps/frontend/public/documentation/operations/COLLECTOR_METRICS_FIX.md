# Collector Metrics Fix

## Problem

The Collectors management table showed **Borrowers = 0**, **Trend = —**, and **Streak = —** even when collectors had assigned groups and payment activity.

Root cause: `packages/domain/src/modules/collectors/service.ts` stubbed production metrics:

| Field | Previous behaviour |
| --- | --- |
| `borrowerCount` | Always `0` after group count query |
| `rateTrend` | Single-point array → Sparkline/`—` |
| `streakWeeks` | Hard-coded `0` |
| `monthlyPerformance` | Hard-coded Jan–Mar at 0% |
| `expectedPesewas` | Set equal to collected (rate always 100%) |
| `alerts` | Always `[]` |

## Formulas

### Borrowers

Count distinct `group_members` for groups where `collector_user_id` matches, member not removed, borrower not deleted, status in `{APPROVED, AT_RISK, DEFAULTED}`.

### Collection rate

\[
rate = \min\left(100,\ \mathrm{round}\left(\frac{collected}{expected}\times 100\right)\right)
\]

When `expected = 0`: rate is `100` if any collections exist, else `0`.

Weekly expected comes from `sumExpectedWeeklyByCollector()` (active loan instalments in assigned groups).

### Trend

Compare latest rolling-month rate with the previous month:

| Condition | Display |
| --- | --- |
| \(\Delta > 2\) pp | ↑ |
| \(\Delta < -2\) pp | ↓ |
| otherwise | → |

### Streak

Count consecutive ISO weeks (newest first) with at least one confirmed payment.

### Six-month performance

Rolling last six calendar months relative to “today” (labels derived from date, never hard-coded Jan–Mar).

Expected for a month ≈ weekly expected × weeks-in-month.

## Queries

- Group / borrower aggregates via SQL joins on `groups`, `group_members`, `borrowers`
- Monthly payment totals: `sumConfirmedPaymentsByCollectorMonth`
- Payment dates for streak: `listConfirmedPaymentDatesByCollector`
- Alerts: recent payments + pending reconciliations + low-rate collectors

## Validation

Cross-check collector row borrower counts against group membership and the Borrowers directory for the same collector’s groups.
