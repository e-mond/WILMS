# Performance Report — v1.7.1

## Frontend

- Operational dashboard removes heavy chart studio from default operator path (charts remain on executive/export workflows)
- Recent Activity uses React Query caching + 60s poll instead of synthetic client alerts
- Modal focus restore deferred to avoid layout thrash / removeChild races

## Backend

- No financial aggregation changes
- Audit list remains limit-scoped

## Follow-up measurements

- Bundle budget check
- Perf budget check
- Table virtualization for large borrower/loan lists
- Export generation timing for large workbooks
