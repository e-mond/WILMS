# RC1 — Session Audit

**Gate:** GATE 4  
**Date:** 2026-06-30

---

## Coverage (inherited P14.6.3 + RC1)

| Area | Evidence |
|------|----------|
| Login/logout | `e2e/logout.spec.ts`, `e2e/auth-and-theme.spec.ts` |
| CSRF | Production smoke `csrf-blocks-login-without-token` 403 |
| Session cookie HttpOnly | Smoke `session-cookie-httponly` |
| Session expiry | `e2e/session-expired.spec.ts` |
| App lock | `e2e/app-lock.spec.ts` |
| Remember Me | `state/loginPreferencesStore.test.ts` |

---

## Cookie flags (production)

- Session: HttpOnly, Secure (production), SameSite=Lax
- CSRF: readable by client for mutation headers

---

## Multi-tab / refresh

App lock state persisted via `appLockStore` (localStorage). Session via HttpOnly cookie survives refresh; expired sessions redirect to `/session-expired`.

---

**Verdict:** PASS — no RC1 regressions identified.
