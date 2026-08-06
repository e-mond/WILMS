# Audit & Compliance Report (v1.7.0)

## Compliance pack

`GET /intelligence/compliance` returns:

- User access summary (active / invited / inactive)
- Permission override count
- Maker-checker related recent audit actions
- Financial integrity notes

## Audit

Immutable audit log and financial ledger reports remain authoritative. Append-only audit entries unchanged.

## Retention

Export jobs expire after 7 days (`export_jobs.expires_at`). Broader retention policy UI remains a follow-up.
