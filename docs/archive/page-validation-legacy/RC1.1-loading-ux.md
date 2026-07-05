# RC1.1 ÔÇö Loading UX

**Date:** 2026-07-01

## Policy

- Debounce: **300ms** (`LOADING_DEBOUNCE_MS`)
- Timeout: **30s** (`LOADING_TIMEOUT_MS`)
- States: skeleton, empty, error, retry, timeout, 403 forbidden

## Infrastructure

- [`useQueryLoadingPolicy`](../../apps/frontend/src/hooks/useQueryLoadingPolicy.ts)
- [`QueryStatePanel`](../../apps/frontend/src/components/feedback/QueryStatePanel.tsx)
- Skeleton variants: `TableSkeleton`, `CardSkeleton`, `LoadingSpinner`

## Panels with loading policy (RC1.1)

| Panel | Variant |
|-------|---------|
| `BorrowerList` | table |
| `LoanPortfolioList` | table |
| `MyRegistrationsList` | table |
| `SuperAdminDashboard` | cards |
| `PendingApplicationsQueue` | table |
| `CollectorsManagementPanel` | table |
| `GroupsManagementPanel` | table |
| `LoanPoolsPanel` | table |
| `RiskFlagsPanel` | table |
| Report panels (index, defaulter, group risk, collector perf) | table/cards |
| Dashboard collection/expense summaries | inline |

## Remaining panels

Detail views (`BorrowerProfilePanel`, `PaymentEntryPanel`, settings sections) use inline spinners or section-level loading. Target: migrate in post-v1.0.0 polish if needed.

## Verdict

**PASS** ÔÇö High-traffic list/dashboard panels use standardized loading policy.
