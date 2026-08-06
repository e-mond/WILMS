# V170 Executive Dashboard Report

**Release:** WILMS v1.7.0  
**Branch:** `feature/v1.7-finance-reporting-intelligence`

## Delivered

Board-level executive intelligence surface:

- Route `/executive` (Super Admin)
- API `GET /intelligence/executive-dashboard`
- Financial KPIs: portfolio, disbursed, collected, outstanding, write-offs, recovery, operating cash, expense ratio, pool utilization, liquidity
- Operational KPIs: active groups/borrowers/loans, collector performance sample, notification/scheduler health hints
- Risk KPIs: PAR 30/60/90 rates, delinquency buckets, write-off trend, high-risk groups, recent alerts
- Filters: community, as-of date; CSV snapshot export; print-friendly layout
- Embedded forecast horizon controls

## Guarantees

Uses existing financial overview + aging/write-off builders — no ledger math changes.
