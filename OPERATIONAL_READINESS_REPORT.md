# Operational Readiness Report — v1.3.6-rc1

**Date:** 2026-07-12

---

## Health monitoring

| Item | Status |
|------|--------|
| `/health` endpoint | Enhanced with `degradedReasons` |
| Production probe | Executed 2026-07-12 — degraded due to migrations (documented) |
| Monitoring guide | `docs/operations/monitoring.md` — update version refs to 1.3.6 |

## Migrations

**Critical:** Production must run through `0022_v135_notification_events.sql` before stable release.

```bash
npm run db:migrate -w @wilms/api
```

## Documentation

| Doc | Status |
|-----|--------|
| `docs/deployment-guide.md` | Updated — health degraded troubleshooting |
| `docs/operations/production-runbook.md` | Exists — bump version on merge |
| `docs/operations/backups.md` | Exists |
| `CHANGELOG.md` | v1.3.6-rc1 section added |

## Smoke tests

| Command | Agent result |
|---------|--------------|
| `smoke:production` | SKIPPED — no `WILMS_APP_URL` in agent |
| `smoke:rbac` | PARTIAL — missing smoke credentials |

## Rollback

Standard Railway/Vercel rollback per `docs/operations/production-runbook.md`. No schema rollback in this RC.

## Ready for production deploy

**Conditional** — apply pending migrations first; re-verify health `status: ok`.
