# RC1.1 ÔÇö Session Audit

**Date:** 2026-07-01

## Controls

| Control | Implementation | Status |
|---------|----------------|--------|
| Session cookie | `wilms_session` HttpOnly, Secure (prod), SameSite=Lax | PASS |
| CSRF | `wilms_csrf` + `x-wilms-csrf` on BFF mutations | PASS |
| CSRF bootstrap | `ensureCsrfToken()` in `apiClient` before POST/PATCH/DELETE | PASS |
| Login | `/api/auth/login` via BFF | PASS |
| Logout | `/api/auth/logout` | PASS |
| Session expiry redirect | `session-expired` route + 401 handler | PASS |
| Idle timeout / app lock | `appLockStore` + overlay | PASS |
| Remember login | `loginPreferencesStore` | PASS |

## Deferred (documented, not faked)

- Server-side session revocation list
- Refresh token rotation (HMAC session tokens today)

## Production smoke

- CSRF blocks login without token: 403
- Session cookie HttpOnly: verified in `production-smoke.ts`

## Verdict

**PASS** ÔÇö Session and CSRF controls production-ready.
