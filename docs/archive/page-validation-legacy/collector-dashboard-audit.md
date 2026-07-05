# Collector Dashboard Audit

Recorded: 2026-06-09

## Objective

Verify Today's Collection and related widgets use **service-driven data** (no hardcoded metrics in UI) and meet production layout quality.

## Architecture (after audit)

```
CollectorDashboardPanel
  ÔööÔöÇÔöÇ useCollectorDashboard ÔåÆ collectorService.getDashboard()
        ÔööÔöÇÔöÇ collectorService.mock ÔåÆ assembleCollectorDashboard()
              Ôö£ÔöÇÔöÇ buildCollectorDashboardCore()     ÔåÉ loans + payments (pure)
              Ôö£ÔöÇÔöÇ buildCollectionMetrics()        ÔåÉ streak/trend inputs
              Ôö£ÔöÇÔöÇ getGroupsDemoSources()            ÔåÉ today's groups
              Ôö£ÔöÇÔöÇ getCollectorsDemoDataset()        ÔåÉ assigned group count
              ÔööÔöÇÔöÇ getFinancialTransactions()        ÔåÉ streak calculation
```

## Today's Collection header

| Field | Source | Hardcoded? |
|---|---|---|
| Amount collected | `summary.collectedPesewas` from payment inputs | No |
| Target | `summary.expectedPesewas` from due borrowers | No |
| % achieved | `summary.collectionRatePercent` | No |
| Borrowers paid | `hero.paidBorrowers` ÔåÉ `summary.paidTodayCount` | No |
| Pending | `hero.pendingBorrowers` ÔåÉ `summary.pendingTodayCount` | No |
| Overdue | `hero.overdueBorrowers` ÔåÉ `summary.missedTodayCount` | No |
| Groups today | `todayGroups.length` from groups factory | No |
| Streak | `computeCollectionStreakDays()` from transaction log | No |
| Weekly trend | `computeWeeklyTrendPercent()` from collection metrics | No |

## Removed violations

| Previous issue | Resolution |
|---|---|
| `streakDays: 12` inline in utils | Moved to transaction-log-based computation |
| `weeklyTrendPercent: 8` inline | Computed from weekly collection metrics |
| `'Market Women Circle...'` alert | Replaced with dynamic group arrears from `collectionRatePercent < 75` |
| Fake group counts `8 + index` | Derived from group sources + borrower rows |

## Today's Groups cards

Each card includes:

- Group name, ID, community, leader (from `GroupSourceRecord`)
- Group avatar via `resolvePersonPhotoUrl`
- Progress bar from paid/expected member counts
- Expected and collected amounts (pesewas)
- Pending member count
- Status badge (Complete / In progress / Pending)
- Mobile expandable details + 44px action link

## Recent payments

Built from borrowers with `collectedPesewas > 0` and payment `recordedAt` from transaction log / payment store.

## UI quality checklist

| Item | Status |
|---|---|
| Information hierarchy | Pass ÔÇö hero ÔåÆ alerts ÔåÆ KPIs ÔåÆ groups ÔåÆ borrowers |
| Equal-height performance cards | Pass ÔÇö `ExecutiveKpiGrid` + `MetricTile min-h-[72px]` |
| Mobile stacking | Pass ÔÇö card-first borrowers, expandable groups |
| No prototype layout | Pass ÔÇö production gradient hero, consistent spacing tokens |

## Tests

- `collector-dashboard.utils.test.ts` ÔÇö core aggregation
- `CollectorDashboardPanel.test.tsx` ÔÇö hero labels + borrower presence

## Sign-off

Collector dashboard is **service-driven** and **audit-compliant** for demo mode and backend swap via `ICollectorService`.
