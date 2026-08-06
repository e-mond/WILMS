# Export Center Report (v1.7.0)

## Surface

- UI `/exports`
- API `POST /exports/jobs`, `GET /exports/jobs`

## Capabilities

- Entity types: borrowers, groups, collectors, loans, payments, reconciliations, expenses, reports, notifications, communications, audit
- Formats: CSV, Excel, PDF (metadata + preview rows; client engines still produce branded downloads)
- Job history with expiration timestamp
- Row count + preview for verification

Background durable file storage on object storage remains a follow-up; jobs are tracked and previewed now.
