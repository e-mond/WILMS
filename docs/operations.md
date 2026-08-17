# Operations

**Purpose:** Day-2 operations for WILMS v1.5 on Vercel + Neon.

---

## Health

| Endpoint | Auth | Notes |
|---|---|---|
| `GET /api/wilms/health` | None | Same as domain `/health` via path map |
| Domain `/health` | None | Used by dual-run Node listen mode |

Response includes service name, version, git commit (when available), database status, and migration summary fields when DB is enabled.

---

## Ops status and metrics

Mounted under the domain API (`/api/v1/ops/...`, reachable as `/api/wilms/ops/...`):

| Endpoint | Auth |
|---|---|
| `GET /ops/status` | Authenticated admin permission |
| `GET /ops/metrics` | `WILMS_METRICS_TOKEN` or admin session |

UI ops surface: `/ops` in the Super Admin portal when enabled for the role.

---

## Scheduler

| Trigger | Path | Schedule |
|---|---|---|
| Vercel Cron | `GET /api/cron/notifications` | `0 6 * * *` UTC |
| Token POST (manual/tools) | `/api/wilms/notifications/scheduler/run` | on demand |
| Token POST | `/api/wilms/communications/scheduler/run` | on demand |

Auth: Vercel Cron requires Production `CRON_SECRET` (`Authorization: Bearer`). Manual runs use `WILMS_SCHEDULER_TOKEN`. The `x-vercel-cron` header is not authentication. Jobs run payment notification processing then communications dispatch. Deduplication and audit behavior live in domain notification/communications services. Ghana timezone is Africa/Accra (UTC+0), so `0 6 * * *` UTC is 06:00 Ghana time.

GitHub Actions workflow `notification-scheduler.yml` is retained for manual `workflow_dispatch` / rollback only; the schedule trigger is disabled.

---

## Logging and request IDs

Domain middleware assigns/propagates `x-request-id`. Prefer correlating incidents with that header and Vercel/runtime logs—not stack traces returned to clients (clients receive safe error envelopes).

---

## Backups and disaster recovery

- **Database:** Neon provides platform backups/PITR according to the Neon plan in use. Exact RPO/RTO must be confirmed in the Neon console for the project—**not hard-coded in this repo**.  
- **Application:** Redeploy from Git + Vercel.  
- **Secrets:** Stored in Vercel; maintain an offline break-glass copy per organization policy.

A repo script `npm run drill:backup-restore` exists for drill automation; treat results as environment-specific evidence.

---

## Incident response (short)

1. Check `GET /api/wilms/health`.  
2. Check Vercel deployment status and recent Cron executions.  
3. Check Neon availability and connection pooling exhaustion.  
4. Check Redis if rate-limit or queue anomalies appear.  
5. Roll back Vercel deployment if a bad release is confirmed.

---

## Maintenance

- Prefer low-traffic windows for schema migrations.  
- After migrations, re-check health migration fields and a financial read path.  
- Never run destructive data scripts against production without a written change record.
