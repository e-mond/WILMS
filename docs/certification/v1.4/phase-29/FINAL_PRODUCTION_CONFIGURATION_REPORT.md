# Final Production Configuration Report

**Version:** 1.4.2 | **Date:** 2026-07-21 | **Phase:** 29

## Environment Variable Table

Full table: [docs/operations/ENVIRONMENT_VARIABLES.md](../../../operations/ENVIRONMENT_VARIABLES.md)

## Production Requirements

| Variable | Required | Secret | Notes |
|----------|----------|--------|-------|
| `DATABASE_URL` | Yes | Yes | PostgreSQL with SSL |
| `WILMS_SESSION_SECRET` | Yes | Yes | ≥ 64 random chars |
| `WILMS_CORS_ORIGIN` | Yes | No | Must match frontend origin |
| `WILMS_APP_URL` | Yes | No | HTTPS public URL |
| `NEXT_PUBLIC_USE_MOCK` | Must be `false` | No | Never mock in prod |
| `WILMS_ENABLE_DEMO_AUTH` | Must be unset/false | No | Blocks demo login |
| `ALLOW_DEMO_SEED` | Must be unset/false | No | Prevents demo seed |
| `REDIS_URL` | Recommended | Yes | Multi-instance + durable queues |
| `WILMS_METRICS_TOKEN` | Yes | Yes | Protects metrics endpoint |
| `CLOUDINARY_URL` | If uploads | Yes | File storage |

## Secrets in Git

**None found.** Demo passwords exist only in seed file with production guards.

## Demo User Purge

```sql
SELECT id, email FROM users WHERE email LIKE '%@wilms.demo';
-- Must return 0 rows before production cutover
```

**BLOCKED** — requires production/staging database access.

## Staging vs Production Separation

Distinct `DATABASE_URL`, secrets, and `WILMS_APP_URL` per environment. No shared session secrets.

## Live Verification Gate

**BLOCKED** — operator must confirm all secrets in secret manager and demo purge SQL.

## Status

**PASS (documentation + code guards)** | Live secret verify **BLOCKED**
