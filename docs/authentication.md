# Authentication and session security

**Purpose:** Document the authentication and route-protection behavior implemented in WILMS v1.5.  
**Not used:** Auth.js / NextAuth (not present in dependencies or routes).

---

## Overview

WILMS uses a **custom HMAC-signed session token** stored in an HTTP-only cookie named `wilms_session`. The same token is accepted as `Authorization: Bearer <token>` by the domain HTTP layer.

---

## Login flow

```text
Browser
  POST /api/auth/login  (Next Route Handler)
        │
        ▼
  Domain POST /auth/login
  (password verify → issue token signed with WILMS_SESSION_SECRET)
        │
        ▼
  Next sets cookie wilms_session (httpOnly, SameSite=Lax, Secure in production)
        │
        ▼
  Subsequent /api/wilms/* calls include cookie;
  Route Handler copies cookie → Authorization Bearer for domain middleware
```

Primary files:

- `apps/frontend/src/app/api/auth/login/route.ts`
- `apps/frontend/src/lib/auth/cookies.ts`, `session.ts`
- `packages/domain/src/modules/auth/routes.ts`
- `packages/domain/src/middleware/authenticate.ts`

Session duration is configured in domain env as 24 hours (`sessionDurationMs`).

---

## CSRF

Mutating requests to `/api/wilms/*` require a valid CSRF cookie/header pair (`wilms_csrf` / `x-wilms-csrf`), enforced in the Route Handler. Public photo-capture session paths are exempt by design.

---

## Frontend middleware (route authorization)

`apps/frontend/src/middleware.ts` resolves the session and applies role → path rules (`canRoleAccessPath`). Unauthenticated users are redirected to login for protected routes. Public paths include login, password reset, session-expired, invitation accept, and capture token routes.

Roles implemented in product portals: Super Admin, Collector, Registration Officer, Approver, Auditor.

---

## Domain RBAC

API handlers use `requireAuth` / `requirePermission` middleware against `@wilms/shared-rbac` permissions, plus optional permission overrides stored in the database (settings module). Maker-checker rules (e.g. cannot approve own loan) are enforced in domain services.

See [PERMISSIONS_AND_ROLES.md](PERMISSIONS_AND_ROLES.md).

---

## Scheduler / Cron authentication

- `POST …/scheduler/run` routes: `WILMS_SCHEDULER_TOKEN` via `Authorization: Bearer` or `x-wilms-scheduler-token`, otherwise session + `MANAGE_COMMUNICATION_SCHEDULER`
- `GET /api/cron/notifications`: `Authorization: Bearer $CRON_SECRET` (Vercel Cron) or `WILMS_SCHEDULER_TOKEN` (manual). The `x-vercel-cron` header is not authentication.

Production Vercel Cron does not send a bearer unless `CRON_SECRET` is set in the Production environment. Missing `CRON_SECRET` causes a 401 and T-1 borrower SMS does not run.

No browser session is required for these endpoints.

---

## Metrics authentication

`GET /ops/metrics` accepts `WILMS_METRICS_TOKEN` or an admin session.

---

## Gaps / verification notes

- Invitation, OTP, and password-reset flows exist under auth modules; operational runbooks should be validated against `packages/domain/src/modules/auth` when changing providers.
- Cookie `Domain` is host-only (no shared parent domain). Same-origin Vercel deployment matches this design.
