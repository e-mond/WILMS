# Operational Readiness Report — v1.3.7

**Date:** 2026-07-13

---

## Health monitoring

| Item | Status |
|------|--------|
| `/health` endpoint | Enhanced with `degradedReasons` |
| Production probe | Executed 2026-07-13 — **degraded** (migrations 23/24, schema missing tables) |
| Monitoring guide | `docs/operations/monitoring.md` |

## Migrations

**Critical:** Production must run through `0025_v137_rc3_pool_allocations_backfill.sql` (26 journal entries).

Journal entries for `0024` and `0025` were added in certification branch `cursor/v137-production-cert-8847`.

```bash
npm run db:migrate -w @wilms/api
```

## Documentation

| Doc | Status |
|-----|--------|
| `docs/certification/v1.3.7/` | **NEW** — 13 certification deliverables |
| `docs/operations/production-runbook.md` | Updated — v1.3.7, migrations through 0025 |
| `docs/financial-calculations.md` | Current |
| `CHANGELOG.md` | v1.3.7 stable |

## Smoke tests

| Command | Agent result (2026-07-13) |
|---------|----------------------------|
| `smoke:production` | **14/33** — schema/migrations degraded; auth 401 |
| `smoke:rbac` | **0/3** — demo credentials disabled in prod |

## Ready for production deploy

**NO** — apply pending migrations, restore schema health, re-run smoke with production credentials. See [docs/certification/v1.3.7/PRODUCTION_CERTIFICATION_REPORT.md](./docs/certification/v1.3.7/PRODUCTION_CERTIFICATION_REPORT.md).
