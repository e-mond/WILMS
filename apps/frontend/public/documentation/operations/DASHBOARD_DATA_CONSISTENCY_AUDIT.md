# Dashboard Data Consistency Audit

Audit date: 13 August 2026  
Scope: WILMS v1.8.0 post-release dashboard / collector / borrower metrics

## Inventory

| Surface | Prior source | Issue | Resolution |
| --- | --- | --- | --- |
| Collectors `borrowerCount` | Domain stub `0` | Always zero | SQL count of active assigned members |
| Collectors `rateTrend` / Trend | Single rate point | UI showed `—` | Rolling 6-month rates + ↑↓→ |
| Collectors `streakWeeks` | Hard `0` | Always `—` | Consecutive payment weeks |
| Collectors `monthlyPerformance` | Jan–Mar zeros | Stale labels | Rolling last 6 months |
| Collectors `expectedPesewas` | = collected | Inflated rates | `sumExpectedWeeklyByCollector` |
| Collector Alerts | `[]` | “No recent activity” | Payments + pending recon + low rate |
| Sidebar Borrowers badge | Unwired / stale | Showed 0 | Shared `borrowers` list query |
| Borrowers Quick Actions | Copy only | Empty panel | Permission-aware links + export |
| Dashboard recon widget | Same API, N+1 list | Empty / UUID | Lightweight list + labels |
| Attention recon count | `() => 0` | Always zero | Live pending count |
| Borrower profile group role | Missing | No leader badge | From `getGroupDetail` |
| Profile photo | Avatar `lg` (48px) | Too small | Avatar `xl` (~96px) |

## Remaining hard-coded / deferred

| Item | Notes |
| --- | --- |
| Expense attention tile | Still `() => 0` — out of this sprint’s priority list |
| Collector `expensesSubmittedCount` | Still 0 in collector list summary |
| Dashboard `expected` vs weekly cycle | Monthly expected approximates weeks-in-month |

## Query performance notes

- Collector list uses parallel aggregates (groups, payments-by-month, payment dates, expected weekly, reconciliations).
- Reconciliation list no longer N+1’s live expected/GPS per row.
- Target: metric queries &lt; 300 ms; collectors page &lt; 500 ms with indexes on `payments(collector_user_id, payment_date)`, `group_members(group_id)`, `groups(collector_user_id)`.
