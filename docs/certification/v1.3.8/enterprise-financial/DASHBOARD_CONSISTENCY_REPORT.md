# Dashboard Consistency Report

**Date:** 17 July 2026

## Problem (audit H-08)

Executive screens could disagree because collections included reversed payments, capital injected double-counted disbursements, and collection rate mixed lifetime collections with weekly due.

## Single derivation path

`buildDashboardFinancialOverview()` is the executive KPI builder.

| KPI | Derivation |
|---|---|
| Total / available capital | `loan_pools` capital − outstanding |
| Capital injected | Pool capital only (no + disbursed) |
| Disbursed | Pool disbursement aggregates (portfolio fallback if no pools) |
| Collected | Pool collected, else CONFIRMED payments (REVERSED excluded) |
| Outstanding | Pool outstanding |
| Expenses | Approved expenses table |
| Net operating cash | Collected + admin fees − expenses |
| Collection rate | This-week CONFIRMED collections ÷ this-week active installment due |

`ledgerSource` is returned on the overview so API consumers can assert provenance.

## Collector performance widget

Still sums confirmed payments by collector vs due loans — reversed payments excluded via `listPayments`.
