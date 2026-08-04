# Architecture

**Purpose:** Describe the implemented WILMS v1.5 system for engineers and reviewers.  
**Verified against:** `apps/frontend`, `packages/domain`, root `vercel.json` (August 2026).

---

## Purpose and scope

WILMS runs staff-facing portals for interest-free group lending. There is **no** borrower self-service login in the current codebase.

In scope: registration, approval, loans/disbursement, collections, reconciliation, expenses, notifications, settings, ops/health.

Out of scope unless explicitly implemented later: Auth.js migration, separate Railway production API, Edge runtime for financial routes.

---

## Runtime topology

```text
                    ┌─────────────────────────────┐
                    │     Vercel (Production)     │
                    │  @wilms/frontend (Next.js)  │
                    │                             │
  Staff browsers ──►│  App Router UI              │
                    │  /api/auth/*                │
                    │  /api/wilms/[...path]  ──┐   │
                    │  /api/cron/notifications│   │
                    └───────────┬─────────────┘   │
                                │                 │
                     handleWilmsFetchRequest      │
                                │                 │
                    ┌───────────▼─────────────┐   │
                    │     @wilms/domain       │◄──┘
                    │  HTTP app (Express)     │
                    │  services/repos/RBAC    │
                    │  financial engine       │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
           Neon PG           Redis            Mail/SMS
         (pooled URL)   (rate limits)       providers
```

### Packages

| Package | Role |
|---|---|
| `@wilms/frontend` | Next.js UI, middleware, BFF-style Route Handlers, Cron route |
| `@wilms/domain` | Domain services, Drizzle schema/migrations, HTTP router, schedulers |
| `@wilms/api` | Thin adapter that starts the domain Node listen loop (optional dual-run) |
| `@wilms/shared-*` | Shared RBAC constants, types, validation, utils, contracts |

### Express status

Express is an **in-process HTTP router** inside `@wilms/domain`, invoked from Next.js Route Handlers. It is not the primary production process boundary. A standalone listen mode remains for local dual-run and emergency rollback.

---

## Request path (API)

1. Browser calls `/api/wilms/<path>` with `credentials: 'include'`.
2. Route Handler enforces CSRF on mutating methods (except public photo-capture session paths).
3. Session cookie `wilms_session` is copied to `Authorization: Bearer …` when present.
4. Path mapping (`apps/frontend/src/lib/api/upstream-path.ts`):
   - `health` → `/health`
   - `auth/*` → `/auth/*`
   - otherwise → `/api/v1/<path>`
5. `handleWilmsFetchRequest` runs the domain Express app and returns the Web Response.

Dual-run: `WILMS_API_MODE=proxy` forwards to `WILMS_API_UPSTREAM` instead.

---

## Data and financial integrity

- Persistence: Drizzle + Neon; migrations under `packages/domain/src/db/migrations`.
- Without `DATABASE_URL`, domain uses in-memory stores (local demo only).
- Financial balances and reports use **SQL aggregation** in repositories/services—not client-side rollups of ledgers.
- Idempotency keys are required on financial mutation POSTs from the browser helper path.
- Maker-checker / separation-of-duties checks live in domain services (loans, reconciliation, expenses, sync conflicts, etc.).

---

## Background work

| Mechanism | Implementation |
|---|---|
| Notification scheduler | Vercel Cron → `GET /api/cron/notifications` (auth via `WILMS_SCHEDULER_TOKEN` or `CRON_SECRET`) |
| Domain scheduler POSTs | Still available under `/api/wilms/notifications/scheduler/run` and communications equivalent (token auth) |
| Mail/SMS jobs | In-process enqueue on serverless; BullMQ workers are not started when `WILMS_RUNTIME`/Vercel indicates serverless |

---

## Portals

Route groups under `apps/frontend/src/app/`: `(super-admin)`, `(collector)`, `(registration-officer)`, `(approver)`, `(auditor)`, `(auth)`.

Frontend middleware enforces role → path access using the shared permission model.

---

## Related documents

- [environment.md](environment.md)
- [authentication.md](authentication.md)
- [deployment-guide.md](deployment-guide.md)
- [v1.5/ARCHITECTURE_MIGRATION_REPORT.md](v1.5/ARCHITECTURE_MIGRATION_REPORT.md)
- ADRs under [adr/](adr/)
