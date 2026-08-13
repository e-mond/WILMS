# Reconciliation Widget Fix

## Problem

Dashboard reconciliation showed “No pending reconciliations” even when the reconciliation module had open items. Collector column showed raw UUIDs. Attention tile count was hard-coded to `0`.

## Causes

1. `listReconciliations` applied per-row `withCollectionMetadata` (live expected recalculation + GPS + full collector scan) — N+1 latency that could empty the widget under load.
2. Widget rendered `collectorId` instead of `collectorLabel`.
3. Attention strip ignored the reconciliation list.

## Fix

| Area | Change |
| --- | --- |
| Domain list | Attach collector labels in one pass; defer live expected / GPS to single-item get |
| Widget KPIs | Pending, Approved today, Rejected today, Total submitted |
| Table | Collector, Date, Amount, Age, Status |
| Empty state | Clear copy when none pending |
| Attention tile | Uses `needsReconciliationReview` count from the same list query |

## Source of truth

Same `GET /reconciliations` + `needsReconciliationReview` filter as `ReconciliationReviewQueue`.

Review mutation already invalidates `['reconciliations']`, so the widget refreshes after approve/reject.
