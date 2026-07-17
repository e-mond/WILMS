# System Monitoring Guide — WILMS v1.3.8

**Version:** 1.3.8  
**Last updated:** 2026-07-17

## 1. Monitoring philosophy

WILMS v1.3.8 provides **platform-native health checks**, **structured API logs with request IDs**, a **Super Admin Operations dashboard**, and a **Prometheus metrics endpoint**. Full OpenTelemetry, centralized APM, and automated alert routing are **recommended for v1.4**, not assumed in production today.

This guide defines what to monitor, how to collect signals, and what to add next.

## 2. Health endpoints

### 2.1 API — `GET /health`

Public. Mounted at root and `/api/v1/health`.

**Use for:** Uptime probes, deploy verification, migration/schema gates.

**Alert when:**

- HTTP ≠ 200
- `status` = `degraded`
- `database.connected` = false
- `migrations.status` ≠ `ok` (watermark behind journal)
- `schema.missingTables` non-empty
- `uploads.valid` = false in production

**Example fields (v1.3.8):**

```json
{
  "status": "ok",
  "version": "1.3.8",
  "database": { "connected": true, "status": "connected" },
  "migrations": { "expected": 28, "applied": 28, "status": "ok" },
  "uploads": { "valid": true, "cloudinaryConfigured": true },
  "schema": { "status": "ok", "missingTables": [] },
  "integrations": {
    "mail": { "provider": "gmail", "configured": true },
    "sms": { "provider": "smsnotifygh", "configured": true }
  }
}
```

Implementation: `apps/backend/src/modules/health/health.service.ts`.

### 2.2 Frontend — BFF probes

| Probe | URL | Expect |
|-------|-----|--------|
| Login shell | `GET https://wilms.vercel.app/login` | 200, WILMS branding |
| CSRF | `GET https://wilms.vercel.app/api/auth/csrf` | 200, token cookie |
| Photo capture (public) | `GET /api/wilms/photo-capture/sessions/{invalid}` | 404 or 503, **never 401** |

### 2.3 Ops status — `GET /api/v1/ops/status`

**Auth:** Super Admin session (`ACCESS_ADMIN_PORTAL`).

Aggregates health, financial snapshot, worker topology, and 18+ operational surfaces. No secrets exposed.

**UI:** Super Admin → **Operations** at `/ops`.

Implementation: `apps/backend/src/modules/ops/service.ts`, frontend `OperationsDashboardPanel.tsx`.

### 2.4 Ops metrics — `GET /api/v1/ops/metrics`

**Auth:**

- `Authorization: Bearer <WILMS_METRICS_TOKEN>`, or
- Header `X-Wilms-Metrics-Token: <token>`, or
- Super Admin session (when token not configured)

**Format:** Prometheus text exposition 0.0.4.

**Exported gauges (v1.3.8):**

| Metric | Meaning |
|--------|---------|
| `wilms_health_up` | 1 when overall health ok |
| `wilms_database_up` | 1 when DB connected |
| `wilms_uptime_seconds` | Process uptime |
| `wilms_mail_configured` | Mail delivery configured |
| `wilms_sms_configured` | SMS configured |
| `wilms_net_operating_cash_pesewas` | Financial snapshot |
| `wilms_outstanding_pesewas` | Portfolio outstanding |
| `wilms_negative_operating_cash` | 1 when net cash negative |
| `wilms_info{version="..."}` | Deployment version |

**Recommended scrape config (external Prometheus):**

```yaml
scrape_configs:
  - job_name: wilms-api
    metrics_path: /api/v1/ops/metrics
    scheme: https
    static_configs:
      - targets: ['wilms-production.up.railway.app']
    authorization:
      credentials: <WILMS_METRICS_TOKEN>
```

Pair with Grafana dashboards. Do **not** expose the metrics token publicly.

## 3. Request correlation (v1.3.8)

### 3.1 `X-Request-Id`

- Middleware: `apps/backend/src/middleware/request-id.ts`
- Accepts incoming `X-Request-Id` (max 128 chars) or generates UUID.
- Response echoes the header.
- `AsyncLocalStorage` propagates ID to all log lines in the request scope.

### 3.2 Log format

API logs are JSON to stdout:

```json
{
  "level": "error",
  "message": "[api] unhandled error",
  "timestamp": "2026-07-17T12:00:00.000Z",
  "service": "wilms-api",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

Implementation: `apps/backend/src/infrastructure/logging/logger.ts`.

### 3.3 Operational use

1. User reports error → collect time and action.
2. Search Railway logs by `requestId` from response header or support tooling.
3. Correlate BFF proxy logs (Vercel) if request ID is forwarded end-to-end (recommended BFF enhancement for v1.4).

## 4. Log signals

| Pattern | Source | Severity | Action |
|---------|--------|----------|--------|
| `[api] unhandled error` | API | High | Stack trace; check 5xx rate |
| `[mail] * failed` | API | Medium–High | Verify `WILMS_VERCEL_MAIL_URL`, Gmail secrets |
| `[auth] login-alert notification failed` | API | Low | Non-blocking; check notification prefs |
| `[schema-health] table probe failed` | API | Critical | Run migrations; Neon connectivity |
| `Export failed` | Frontend | Medium | User export; check browser console |
| `RATE_LIMITED` | API | Info | Possible brute force; review IP |
| `financial_snapshot_unavailable` | Ops status | Medium | DB query failure on dashboard |

## 5. Platform-native monitoring

| Platform | Use |
|----------|-----|
| **Railway** | Deploy logs, CPU/memory, restart events, `/health` check |
| **Vercel** | Build/deploy status, function logs, analytics |
| **Neon** | Connection count, query insights, PITR, storage |
| **Cloudinary** | Upload errors, bandwidth |

## 6. Automated smoke checks

```bash
# Production connectivity + critical routes
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
WILMS_SMOKE_EMAIL=<prod-admin> \
WILMS_SMOKE_PASSWORD=<secret> \
npm run smoke:production -w @wilms/api

# Role-based access via BFF
WILMS_APP_URL=https://wilms.vercel.app \
npm run smoke:rbac -w @wilms/api

# Version consistency
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
npm run verify:version
```

Production smoke requires real credentials — demo accounts are disabled on live hosts (`smoke-credentials.ts`).

## 7. CI quality gates (every PR)

From `.github/workflows/ci.yml`:

| Gate | Command |
|------|---------|
| Type check | `npm run type-check` |
| Lint | `npm run lint` |
| API integrity | `npm run verify:api-integrity` |
| Mock guard | `npm run verify:mock-guard` |
| Build + bundle budget | `npm run build`, `bundle:budget-check` |
| Performance budget | `npm run perf:budget-check` |
| Backend tests | `npm run test -w @wilms/api` |
| Frontend tests | `npm test` |
| Secret scan | gitleaks |
| npm audit | critical level |

E2E runs in frontend workspace (`npm run test:e2e`).

## 8. Performance budgets

| Metric | Budget | Check |
|--------|--------|-------|
| JS bundle (gzip) | 350 KB | `npm run bundle:budget-check` |
| CSS bundle (gzip) | 100 KB | `npm run bundle:budget-check` |

Use Neon query insights for slow SQL. Migration `0027_hot_query_indexes` adds indexes on `payments` and `ledger_entries` hot paths.

## 9. Recommendations for v1.4+

| Capability | Priority | Notes |
|------------|----------|-------|
| Prometheus + Grafana | High | Scrape `/api/v1/ops/metrics`; alert on `wilms_health_up == 0` |
| Sentry (optional) | Medium | Frontend + API error aggregation |
| OpenTelemetry + Jaeger | Medium | Trace money paths: payments, disbursements, reversals |
| BFF request ID propagation | Medium | Forward `X-Request-Id` in BFF proxy |
| Slow query logging | Medium | Neon insights + optional app-level threshold |
| Redis queue depth metrics | High (with v1.4 queues) | `wilms_queue_depth` when BullMQ deployed |
| Synthetic checks | Medium | Scheduled smoke from GitHub Actions cron |

**Not claimed today:** Fortune-500 SRE stack, full OTel wiring, in-app alert bus.

## 10. Cross-references

- [PRODUCTION_ALERT_MATRIX.md](./PRODUCTION_ALERT_MATRIX.md) — alert definitions
- [OPERATIONS_DASHBOARD_SPEC.md](./OPERATIONS_DASHBOARD_SPEC.md) — `/ops` spec
- [docs/operations/monitoring.md](../../../operations/monitoring.md) — short reference
