# Production Operations Manual — WILMS v1.3.8

**Version:** 1.3.8  
**Last updated:** 2026-07-17  
**Status:** Active

## 1. Purpose

This manual defines how WILMS is operated in production: architecture, daily routines, deploy/rollback references, monitoring, and escalation. It is written for Super Admins, SRE/DevOps, and on-call engineers.

**Scope:** Production (`wilms.vercel.app`, Railway API, Neon PostgreSQL). Staging follows the same patterns with separate secrets.

## 2. System architecture

```
┌─────────────────┐     BFF /api/wilms/*      ┌──────────────────┐
│  Vercel         │ ─────────────────────────►│  Railway API     │
│  Next.js 14     │   CSRF, cookies, proxy    │  Express         │
│  wilms.vercel   │                           │  /health, /api/v1│
└────────┬────────┘                           └────────┬─────────┘
         │                                             │
         │ mail relay /api/mail/send                   │ DATABASE_URL
         ▼                                             ▼
┌─────────────────┐                           ┌──────────────────┐
│  Gmail / Resend │                           │  Neon PostgreSQL │
│  (Vercel SMTP)  │                           │  Drizzle migrate │
└─────────────────┘                           └──────────────────┘

External: Cloudinary (uploads), SMSNotifyGH / Arkesel / Twilio (SMS)
```

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | Vercel | Root `vercel.json`; build `@wilms/frontend` |
| API | Railway | Root `Dockerfile`, `railway.toml`; health `/health` |
| Database | Neon | `DATABASE_URL`; 28 migrations through `0027_hot_query_indexes` |
| Uploads | Cloudinary | `UPLOAD_PROVIDER=cloudinary` in production |
| Workers | In-process | `redis: not_used`, `queue: in_process`, `scheduler: http_triggered` |
| Mail | Gmail/Resend/SMTP | Gmail often relayed via Vercel when Railway SMTP blocked |
| SMS | SMSNotifyGH (default) | Arkesel, Twilio supported via env |

Browser traffic **must** use the Vercel BFF (`NEXT_PUBLIC_API_BASE_URL=/api/wilms`). Direct API calls from browsers bypass CSRF protection.

## 3. Roles and access

| Role | Portal | Production ops access |
|------|--------|----------------------|
| Super Admin | Admin + `/ops` | Full system, users, settings, reconciliation, operations dashboard |
| Collector | Field / mobile PWA | Assigned borrowers, payments, expenses |
| Registration Officer | Registration wizard | Borrower onboarding, documents |
| Approver | Approval workflows | Loans, offline sync conflicts |
| Auditor | Reports (read-only) | Audit log, exports; no admin portal |

Permission source: `packages/shared-rbac`. See [permission-matrix.md](../../../permission-matrix.md) and role guides in this pack.

## 4. Authentication and security (production)

| Control | Implementation |
|---------|----------------|
| Sessions | HMAC-signed tokens; `session_version` invalidation on role/password changes |
| Demo logins | **Not available in production** — API uses database users when `DATABASE_URL` is set; `@wilms.demo` accounts apply only to in-memory dev; frontend demo banner requires mock mode |
| CSRF | Double-submit on mutating BFF `/api/wilms/*` (exceptions: photo-capture public routes) |
| Headers | Helmet on API |
| Rate limiting | Login: 20 attempts / 15 min (`login-rate-limit.ts`); general API rate-limit middleware |
| Account lockout | Configurable via system settings (`failed_login_lockout_attempts`, default 5) |
| Uploads | MIME/size validation; Cloudinary in production |

See [security-guide.md](../../../security-guide.md).

## 5. Daily operations

### 5.1 Morning health check (5 min)

1. `GET /health` — expect `status: ok`, `version: 1.3.8`, migrations watermark current.
2. Super Admin → **Operations** (`/ops`) — review surface grid; refresh if any **Degraded**.
3. Confirm external uptime probes green (API health, login page).
4. Scan Railway logs for `[api] unhandled error` or `[mail] * failed`.

### 5.2 Weekly

- Review [PRODUCTION_ALERT_MATRIX.md](./PRODUCTION_ALERT_MATRIX.md) tuning.
- Confirm Neon PITR retention and backup calendar entry.
- Run `npm run smoke:production` and `smoke:rbac` against production (with `WILMS_SMOKE_*` secrets).
- Review audit log for unusual auth or financial events.

### 5.3 Per release

Follow [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md) and [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md).

## 6. Key endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /health` | Public | Version, DB, migrations, schema, integrations |
| `GET /api/v1/ops/status` | Super Admin session | Aggregated ops report (no secrets) |
| `GET /api/v1/ops/metrics` | Super Admin session **or** `WILMS_METRICS_TOKEN` | Prometheus text exposition |
| `GET /api/auth/csrf` | Public (Vercel) | BFF availability probe |

## 7. Configuration management

| Store | Contents |
|-------|----------|
| Railway env | `DATABASE_URL`, `WILMS_SESSION_SECRET`, `WILMS_CORS_ORIGIN`, SMS, mail upstream, Cloudinary |
| Vercel env | `WILMS_API_UPSTREAM`, `NEXT_PUBLIC_*`, Gmail relay secrets |
| GitHub secrets | Deploy workflow: `DATABASE_URL`, `RAILWAY_*`, `VERCEL_*`, `WILMS_SMOKE_*` |

Never commit secrets. Export env snapshots before major changes.

## 8. Financial operations guardrails

Non-negotiable business rules (from BRD):

- No partial payments; no advance payments.
- Payments clear oldest obligation first.
- Balances derived from transactions — no manual balance entry.
- Adjustments require Super Admin approval.
- Audit log is immutable.

For financial incidents, use [INCIDENT_RESPONSE_PLAYBOOK.md](./INCIDENT_RESPONSE_PLAYBOOK.md) § Financial.

## 9. Worker topology (v1.3.8)

Background work runs **in-process** on the API container:

- Notifications and mail dispatch execute synchronously or via in-process handlers.
- Scheduled jobs are **HTTP-triggered** (no persistent cron worker).
- **Redis/BullMQ is not deployed** — planned for v1.4.

Implication: API restarts interrupt in-flight background work; scale horizontally only after v1.4 durable queues.

## 10. Observability (v1.3.8)

| Signal | Status |
|--------|--------|
| Request correlation | `X-Request-Id` middleware + `AsyncLocalStorage` in API JSON logs |
| Structured API logs | JSON to stdout (Railway) |
| Metrics endpoint | `GET /api/v1/ops/metrics` (Prometheus text) |
| Super Admin dashboard | `/ops` UI |
| OpenTelemetry / APM | **Not wired** — recommended v1.4 |
| Sentry | **Optional** — types exist; configure DSN if adopted |

See [SYSTEM_MONITORING_GUIDE.md](./SYSTEM_MONITORING_GUIDE.md).

## 11. Deploy and rollback

| Action | Runbook |
|--------|---------|
| Production deploy | [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md) |
| Rollback | [ROLLBACK_RUNBOOK.md](./ROLLBACK_RUNBOOK.md) |
| Backup / restore | [BACKUP_AND_RECOVERY_PLAN.md](./BACKUP_AND_RECOVERY_PLAN.md) |

Deploy gate: GitHub Actions `Deploy Production` with `confirm=deploy`.

Blue/green and canary are **not native**. Use Vercel instant rollback (frontend) and Railway previous deployment (API). See rollback runbook.

## 12. Feature flags

**Not implemented** as a product capability in v1.3.8. Recommended for v1.4 (e.g. GL dual-write, durable queue cutover). Document env-based toggles in release notes until a flag service exists.

## 13. Escalation

| Tier | Contact | When |
|------|---------|------|
| L1 | Super Admin / support lead | User-facing issues, password resets |
| L2 | On-call engineer | API degraded, deploy failure, integration outage |
| L3 | DBA + engineering lead | Migration failure, data corruption, PITR restore |

See [PRODUCTION_SUPPORT_MANUAL.md](./PRODUCTION_SUPPORT_MANUAL.md) and [INCIDENT_RESPONSE_PLAYBOOK.md](./INCIDENT_RESPONSE_PLAYBOOK.md).

## 14. Document index

Full pack: [INDEX.md](./INDEX.md).

Legacy short runbooks (updated for v1.3.8): [docs/operations/](../../../operations/).
