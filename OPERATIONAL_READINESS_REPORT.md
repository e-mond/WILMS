# Operational Readiness Report — v1.3.7

**Date:** 2026-07-13 (remediation sprint)

---

## Health monitoring

| Item | Status |
|------|--------|
| `/health` endpoint | Extended with `integrations`, `workers` |
| Production probe | **degraded** — migrations 23/24, schema gaps |
| Remediation | `0026` schema repair + journal fix in PR |

## Migrations

```bash
npm run verify:migrations    # journal integrity
npm run db:migrate -w @wilms/api   # on production DATABASE_URL
```

Journal: **27 entries** (`0000`–`0026`).

## Smoke tests

| Command | Result |
|---------|--------|
| `smoke:production` | **BLOCKED** — requires `WILMS_SMOKE_*` on live |
| `smoke:rbac` | **BLOCKED** — requires per-role prod credentials |

## Ready for production deploy

**NO** — merge remediation PR, redeploy Railway, confirm health `ok`, then re-run smoke.

See [docs/certification/v1.3.7/REMEDIATION_RUNBOOK.md](./docs/certification/v1.3.7/REMEDIATION_RUNBOOK.md).
