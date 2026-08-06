# Financial Reporting Report (v1.7.0)

## Existing retained

Daily collection, loan portfolio, defaulters, collector performance, group risk, financial ledger, audit log, write-offs, aging analysis.

## Added

| Report | API |
|--------|-----|
| Portfolio breakdown | `GET /intelligence/portfolio-breakdown` |
| Executive snapshot | `GET /intelligence/executive-dashboard` |
| Compliance pack | `GET /intelligence/compliance` |

Client PDF/Excel/CSV remain via `features/export`. Server export jobs track generation metadata in `export_jobs` (migration `0035`).
