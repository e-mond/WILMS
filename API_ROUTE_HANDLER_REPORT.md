# API Route Handler Report — v1.5.0

## Strategy

All former Express business routes are served through:

`apps/frontend/src/app/api/wilms/[...path]/route.ts`

which calls `handleWilmsFetchRequest` from `@wilms/domain`. Path mapping uses `resolveWilmsProxyUpstreamPath` (unchanged contract for the browser).

## Runtime settings

- `runtime = 'nodejs'`
- `dynamic = 'force-dynamic'`
- `maxDuration = 60` (catch-all); cron route `maxDuration = 300`

## Duration audit (top workloads)

Measurements are design limits based on prior Railway behavior and Vercel Pro caps. Re-measure on Preview with production-like data before final DoD.

| Workload | Endpoint / entry | Observed / expected | Fit for Route Handler? | Notes |
|---|---|---|---|---|
| Payment notification scan | Cron + `POST …/notifications/scheduler/run` | Typically seconds–tens of seconds | Yes on Pro (300s cron) | Keep batch sizes bounded |
| Communications dispatch | Cron + `POST …/communications/scheduler/run` | Depends on outbound SMS/email volume | Yes with in-process send; watch 300s | Prefer queue+Redis if volume grows |
| Financial reports | `GET /api/v1/reports/*` | SQL aggregation; usually <10s | Yes at 60s | Keep SQL aggregation; paginate exports |
| Reconciliation submit/review | `POST /reconciliations*` | Transactional; seconds | Yes | Idempotency preserved |
| Offline sync batch | `POST /sync/offline/batch` | Depends on batch size | Yes if batch capped | Enforce payload limits |

Any future job exceeding Pro limits must move to chunked/trigger-and-poll before claiming SLA.

## CSRF / session

Mutating `/api/wilms/*` requests (except public photo-capture session paths) require CSRF. Session cookie is attached as Bearer for domain auth middleware.
