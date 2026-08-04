# QA Verification Report — v1.3.5

**Date:** 2026-07-11  
**Version:** 1.3.5  
**Environment:** Cloud agent (Linux, Node 20+)

---

## Automated Gates

| Gate | Command | Result | Detail |
|------|---------|--------|--------|
| Type check | `npm run type-check` | **PASS** | Frontend + API |
| Lint | `npm run lint` | **PASS** | 0 warnings |
| Production build | `npm run build` | **PASS** | 55 routes |
| Backend unit tests | `npm test -w @wilms/api` | **PASS** | 105/105 |
| Frontend unit tests | `npm test` | **PASS** | 233/233 |
| Version consistency | `npm run verify:version` | **PASS** | 1.3.5 all packages |
| Bundle budget | `npm run bundle:budget-check` | **PASS** | 168.6 KB JS, 9.0 KB CSS |
| Perf budget | `npm run perf:budget-check` | **PASS** | Bundle check |

---

## E2E Tests

| Spec | Result |
|------|--------|
| `e2e/login-ux.spec.ts` (desktop + mobile) | 8/8 PASS |
| `e2e/forgot-password.spec.ts` (desktop + mobile) | 10/10 PASS |

**Total login/forgot-password E2E:** 18/18 PASS

Full Playwright suite (all specs) not executed this cycle.

---

## Production Smoke

| Suite | Result | Reason |
|-------|--------|--------|
| `smoke:production` | **SKIPPED** | `WILMS_APP_URL` not configured in agent |
| `smoke:rbac` | **PARTIAL** | 2/4 — `admin-login` and `officer-blocked-dashboard` require smoke credentials |

RBAC smoke output:
- collector-login: ok
- officer-login: ok
- admin-login: failed
- officer-blocked-dashboard: expect 403

---

## Workflow Coverage (Code Review + Unit Tests)

| Workflow | Verified by |
|----------|-------------|
| Login / logout | Unit + E2E |
| Registration | Existing mock tests |
| Invitations | `invitation.test.ts`, invitation-accepted dispatch |
| Password reset | `password-reset-routes.test.ts`, password-changed notify |
| Emails | `email-layout.test.ts`, `templates.test.ts`, `email-catalogue.test.ts` |
| Notifications | `notificationService.mock.test.ts`, inbox hooks |
| Communication center | `communication-platform.test.ts` |
| Mobile capture (regression) | `public-routes.test.ts` |
| Photo capture 401 fix | Retained from v1.3.4 |

---

## Console / Runtime

| Check | Result |
|-------|--------|
| TypeScript errors | 0 |
| ESLint errors | 0 |
| Test failures | 0 |
| Hydration issues | None observed in unit/E2E tests |

---

## Verdict

**PASS** for all locally executable gates. Production smoke and full E2E suite require deploy environment with secrets.
