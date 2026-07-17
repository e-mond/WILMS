# WILMS Production Monitoring

**Version:** v1.3.8  
**Last updated:** 2026-07-17

> **Full pack:** [docs/certification/v1.3.8/production-operations/](../certification/v1.3.8/production-operations/INDEX.md) — [SYSTEM_MONITORING_GUIDE.md](../certification/v1.3.8/production-operations/SYSTEM_MONITORING_GUIDE.md), [PRODUCTION_ALERT_MATRIX.md](../certification/v1.3.8/production-operations/PRODUCTION_ALERT_MATRIX.md)

## Health endpoints

| Endpoint | Service | Purpose |
|----------|---------|---------|
| `GET /health` | Railway API | Version, DB, migrations, uploads, schema, integrations |
| `GET /api/v1/ops/status` | Railway API | Super Admin ops report (auth required) |
| `GET /api/v1/ops/metrics` | Railway API | Prometheus text metrics (Super Admin or `WILMS_METRICS_TOKEN`) |
| `GET /api/auth/csrf` | Vercel BFF | Frontend availability probe |

### API health response fields

```json
{
  "status": "ok | degraded",
  "version": "1.3.8",
  "database": { "connected": true, "status": "connected" },
  "migrations": { "expected": 28, "applied": 28, "status": "ok" },
  "uploads": { "valid": true, "cloudinaryConfigured": true },
  "schema": { "status": "ok", "missingTables": [] }
}
```

**Alert when:** `status` is `degraded`, `database.connected` is false, `migrations.status` is not `ok`, or `schema.missingTables` is non-empty.

## Operations dashboard (v1.3.8)

Super Admin UI: **https://wilms.vercel.app/ops**

- Authenticated `GET /api/wilms/ops/status` via BFF
- Surfaces: system, database, email, SMS, storage, financial engine, workers (in-process), deployment version, etc.
- Manual **Refresh**; no secrets displayed

Spec: [OPERATIONS_DASHBOARD_SPEC.md](../certification/v1.3.8/production-operations/OPERATIONS_DASHBOARD_SPEC.md)

## Request correlation (v1.3.8)

- API middleware assigns/propagates **`X-Request-Id`** (`apps/backend/src/middleware/request-id.ts`)
- **`AsyncLocalStorage`** injects `requestId` into all JSON log lines
- Use response header + Railway log search for incident triage

## Prometheus metrics

Scrape `GET /api/v1/ops/metrics` with:

- `Authorization: Bearer <WILMS_METRICS_TOKEN>`, or
- `X-Wilms-Metrics-Token: <token>`, or
- Super Admin session

Key gauges: `wilms_health_up`, `wilms_database_up`, `wilms_uptime_seconds`, `wilms_mail_configured`, `wilms_sms_configured`, `wilms_net_operating_cash_pesewas`, `wilms_negative_operating_cash`.

**Recommended:** External Prometheus + Grafana (not bundled in app). OpenTelemetry/Jaeger planned v1.4.

## Automated smoke checks

```bash
# Production connectivity + critical routes
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
WILMS_SMOKE_EMAIL=<production-admin> \
WILMS_SMOKE_PASSWORD=<secret> \
npm run smoke:production -w @wilms/api

# Role-based access via BFF
WILMS_APP_URL=https://wilms.vercel.app \
npm run smoke:rbac -w @wilms/api

# Version consistency after deploy
npm run verify:version
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
npm run verify:version
```

Production requires real credentials — demo accounts disabled on live hosts.

## CI gates (every PR)

| Gate | Command |
|------|---------|
| Type check | `npm run type-check` |
| Lint | `npm run lint` |
| API integrity | `npm run verify:api-integrity` |
| Mock guard | `npm run verify:mock-guard` |
| Unit tests | `npm test` + `npm run test -w @wilms/api` |
| E2E | `npm run test:e2e -w @wilms/frontend` |
| Bundle budget | `npm run bundle:budget-check` |
| Performance budget | `npm run perf:budget-check` |

## Log signals

| Pattern | Source | Action |
|---------|--------|--------|
| `[api] unhandled error` | API | Investigate stack trace; check `requestId` |
| `[mail] * failed` | API | Check mail relay secrets |
| `[auth] login-alert notification failed` | API | Non-blocking; verify notification prefs |
| `[schema-health] table probe failed` | API | Run migrations; check Neon connectivity |
| `Export failed` | Frontend | User-facing export error; check browser console |
| `RATE_LIMITED` | API | Possible brute force on login |

## Uptime monitoring (recommended)

Configure external probes (e.g. Railway/Vercel integrations or third-party):

1. `GET https://wilms-production.up.railway.app/health` — expect 200, `version` matches release
2. `GET https://wilms.vercel.app/login` — expect 200
3. `GET https://wilms.vercel.app/api/auth/csrf` — expect 200
4. Public capture lookup — must not return 401 (see [deployment-guide.md](../deployment-guide.md))

## Performance budgets

| Metric | Budget | Check |
|--------|--------|-------|
| JS bundle (gzip) | 350 KB | `npm run bundle:budget-check` |
| CSS bundle (gzip) | 100 KB | `npm run bundle:budget-check` |

Migration `0027_hot_query_indexes` optimizes hot payment/ledger queries in production.
