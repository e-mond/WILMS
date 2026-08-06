# Forecasting & Analytics Report (v1.7.0)

## Method

Schedule-based forecasting (not ML):

- Weekly due from financial overview × horizon weeks
- Projected collections = expected × observed collection rate (floored at 40%)
- Expense projection scales recent expense intensity
- Liquidity forecast = available capital + projected cash flow
- Delinquency pressure index from aging buckets

API: `GET /intelligence/forecast?horizonDays=`

## Early warning

Configurable thresholds (`alert_thresholds`) evaluated via `POST /intelligence/early-warnings/evaluate`.

Default seeds: collection rate floor, overdue amount ceiling, expense ratio ceiling.
