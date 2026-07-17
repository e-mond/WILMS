# Operations Dashboard Specification — WILMS v1.3.8

**Version:** 1.3.8  
**Last updated:** 2026-07-17  
**Status:** Implemented (Super Admin UI + API)

## 1. Purpose

Provide Super Admins a single in-app view of production health, deployment metadata, integration status, worker topology, and financial snapshot — without exposing secrets.

## 2. Access control

| Surface | Route | Permission | Auth |
|---------|-------|------------|------|
| UI | `/ops` | `ACCESS_ADMIN_PORTAL` (Super Admin) | Session cookie via BFF |
| API | `GET /api/v1/ops/status` | `ACCESS_ADMIN_PORTAL` | Session Bearer via BFF |
| Metrics | `GET /api/v1/ops/metrics` | Super Admin **or** `WILMS_METRICS_TOKEN` | See below |

Navigation: Super Admin shell → **Operations** (`navigation.ts` → `href: '/ops'`).

Implementation:

- Backend: `apps/backend/src/modules/ops/`
- Frontend page: `apps/frontend/src/app/(super-admin)/ops/page.tsx`
- Panel: `apps/frontend/src/features/ops/components/OperationsDashboardPanel.tsx`
- Client: `apps/frontend/src/services/opsService.ts`

## 3. API — `GET /api/v1/ops/status`

### Request

```
GET /api/wilms/ops/status
Cookie: wilms_session=...
X-CSRF-Token: ... (mutating only; GET uses session)
```

Proxied to Railway: `GET /api/v1/ops/status`.

### Response shape (`OpsStatusReport`)

```typescript
{
  generatedAt: string;           // ISO timestamp
  deployment: {
    version: string;             // e.g. "1.3.8"
    gitCommit: string | null;
    environment: string;
    nodeVersion: string;
    buildId: string | null;
    deployedAt: string | null;
  };
  health: HealthReport;          // Full health probe (subset shown in UI)
  surfaces: OpsSurface[];        // Operational surface grid
  workers: {
    redis: 'not_used';
    queue: 'in_process';
    scheduler: 'http_triggered';
    note: string;
  };
  financial: {
    availableCapitalPesewas: number;
    totalDisbursedPesewas: number;
    totalCollectedPesewas: number;
    outstandingPesewas: number;
    totalExpensesPesewas: number;
    netOperatingCashPesewas: number;
    collectionRatePercent: number;
    alerts: string[];            // e.g. "negative_operating_cash"
  } | null;
  databaseEnabled: boolean;
  backups: {
    status: 'external_managed';
    provider: 'neon';
    detail: string;
  };
}
```

### Surface states

| State | UI label | Meaning |
|-------|----------|---------|
| `ok` | OK | Probe passed |
| `degraded` | Degraded | Partial failure or config gap |
| `unavailable` | Unavailable | Hard failure |
| `external` | External | Probe outside API (frontend, Neon backups) |
| `not_applicable` | N/A | Not used in v1.3.8 (e.g. Redis) |

### Surfaces (v1.3.8)

| ID | Label | Typical state |
|----|-------|---------------|
| `system` | System Health | From `/health` aggregate |
| `database` | Database | Connection + migrations + schema |
| `queue_workers` | Queue Workers | In-process (ok) |
| `storage` | Storage | Cloudinary validity |
| `redis` | Redis | N/A |
| `email` | Email | Mail provider configured |
| `sms` | SMS | SMS provider configured |
| `api` | API | Version + uptime |
| `frontend` | Frontend | External — probe separately |
| `background_jobs` | Background Jobs | In-process |
| `scheduled_jobs` | Scheduled Jobs | HTTP-triggered |
| `financial_engine` | Financial Engine | Net cash + alerts |
| `daily_collections` | Daily Collections | Snapshot from DB |
| `loan_pools` | Loan Pools | Available capital |
| `expenses` | Expenses | Total expenses |
| `notifications` | Notifications | Channel availability |
| `security_events` | Security Events | External — audit log |
| `deployment_version` | Deployment Version | Version + commit |
| `backup_status` | Backup Status | External — Neon console |

## 4. API — `GET /api/v1/ops/metrics`

### Auth

1. `Authorization: Bearer <WILMS_METRICS_TOKEN>` — timing-safe compare
2. `X-Wilms-Metrics-Token: <token>`
3. Else: Super Admin session (`requireAuth` + `ACCESS_ADMIN_PORTAL`)

Env: `WILMS_METRICS_TOKEN` on Railway (`apps/backend/src/config/env.ts`).

### Response

`Content-Type: text/plain; version=0.0.4; charset=utf-8`

Prometheus gauges — see [SYSTEM_MONITORING_GUIDE.md](./SYSTEM_MONITORING_GUIDE.md) § Metrics.

## 5. UI specification

### Layout (`OperationsDashboardPanel`)

1. **Header** — Title "Operations", description, **Refresh** button
2. **Deployment** — Version, environment, git commit (12 chars), Node, health status, generated timestamp
3. **Degraded reasons** — Amber banner when `health.degradedReasons` non-empty
4. **Financial summary** — Capital, disbursed, collected, outstanding, expenses, net operating cash, collection rate; alert banner for negative cash
5. **Worker topology** — Redis / queue / scheduler badges + note
6. **Surface grid** — Card per surface: label, state badge (color-coded), detail text
7. **Backups** — Neon external_managed callout

### State colors

| State | Style |
|-------|-------|
| ok | Emerald |
| degraded | Amber |
| unavailable | Red |
| external / N/A | Slate |

### Error handling

- API failure → alert role="alert" with message
- Loading → "Refreshing…" on button; no blocking skeleton required (v1.3.8)

### Accessibility

- Section headings with `aria-labelledby`
- State communicated in text (not color-only)
- `data-tour="operations-dashboard"` for onboarding tour

## 6. Non-goals (v1.3.8)

- Real-time WebSocket updates (manual refresh only)
- Historical metrics charts in UI (use Grafana)
- Secret or env display
- Neon backup probe (external_managed only)
- Frontend health inline probe (documented as external)

## 7. Future enhancements (v1.4+)

| Feature | Priority |
|---------|----------|
| Auto-refresh interval (30s) | Medium |
| Link to Grafana dashboard | Medium |
| Incident banner integration | Low |
| Queue depth when Redis deployed | High |
| Request ID search from UI | Medium |

## 8. Testing

- Backend unit: `apps/backend/src/tests/ops/ops.service.test.ts`
- Manual: Super Admin login → `/ops` → Refresh → verify surfaces match `/health`

## 9. Related docs

- [SYSTEM_MONITORING_GUIDE.md](./SYSTEM_MONITORING_GUIDE.md)
- [PRODUCTION_ALERT_MATRIX.md](./PRODUCTION_ALERT_MATRIX.md)
- [ADMINISTRATOR_GUIDE.md](./ADMINISTRATOR_GUIDE.md)
