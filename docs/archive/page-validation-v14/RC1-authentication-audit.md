# RC1 Authentication & Session Audit

**Date:** 2026-07-01

## Login / logout

| Flow | Implementation | Status |
|------|----------------|--------|
| Login | `POST /auth/login` → session cookie | Verified in code |
| Logout | `POST /auth/logout` + client session clear | Verified |
| Session expiry | `SessionExpiryHandler` + 401 handler | Verified |
| CSRF | `rejectInvalidCsrf` on BFF mutating requests | Verified |

## Session cookie

- HttpOnly session via Next.js BFF proxy ([`apps/frontend/src/app/api/wilms/[...path]/route.ts`](../../apps/frontend/src/app/api/wilms/[...path]/route.ts))
- `WILMS_SESSION_SECRET` required in production (≥32 chars)

## RBAC

- Five roles: Super Admin, Approver, Registration Officer, Collector, Auditor
- `PermissionGate` + backend `requirePermission` middleware
- Role shells: `(super-admin)`, `(approver)`, `(registration-officer)`, `(collector)`, `(auditor)` layouts

## App lock (field device security)

| Setting | Value | File |
|---------|-------|------|
| Default idle timeout | 9 minutes | `apps/frontend/src/constants/app-lock.ts` |
| PIN storage | localStorage via `appLockStore` (hashed) | `apps/frontend/src/state/appLockStore.ts` |
| Idle enforcement | `AppLockHandler` — locks after idle, on tab return if elapsed | `apps/frontend/src/components/auth/AppLockHandler.tsx` |
| Mandatory setup | `AppLockRequiredGate` for authenticated users | Verified |

## Settings profile

- `GET /settings/me` — registered, requires auth ([`apps/backend/src/modules/settings/routes.ts`](../../apps/backend/src/modules/settings/routes.ts))

## Verdict

Authentication architecture complete. Production requires Railway deploy with latest backend (settings routes) and correct Vercel env vars.
