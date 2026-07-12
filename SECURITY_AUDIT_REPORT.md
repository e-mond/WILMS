# Security Audit Report — v1.3.6-rc1

**Date:** 2026-07-12  
**Scope:** Stabilisation fixes only (no new features)

---

## Findings addressed

| ID | Area | Severity | Finding | Resolution |
|----|------|----------|---------|------------|
| SEC-001 | Mock data | High | Production webpack could bundle mock services if build env lacked API URL | `next.config.mjs` — `shouldUseMockServices()` returns `false` when `NODE_ENV=production` |
| SEC-002 | Messaging API | Medium | Strict UUID validation blocked legitimate user ids (`user-collector`) | `messages/routes.ts` — accept bounded string ids; validated in service layer |
| SEC-003 | Health disclosure | Low | `degraded` status lacked actionable detail | Added `degradedReasons` — no secrets exposed (verified `health.service.test.ts`) |

## Existing controls verified (unchanged)

| Control | Location | Status |
|---------|----------|--------|
| Production mock flag guard | `apps/backend/src/config/mock-guard.ts` | PASS — exits on mock flags in production |
| CSRF on BFF | `production-smoke.ts` | PASS (when run with credentials) |
| Session HMAC | Health `session.provider` | PASS |
| RBAC middleware | `requireAuth`, `PermissionGate` | PASS — no changes this RC |
| Upload env validation | `env-validation.ts` | PASS — production Cloudinary validated on live health |

## Production health probe (2026-07-12)

Live `GET https://wilms-production.up.railway.app/health` — database connected, uploads valid. Degraded due to **pending migrations**, not auth/secrets failure.

## Tests

- Backend: **108/108 PASS** (includes `messages/routes.schema.test.ts`)
- No new security regressions introduced in changed files.

## Residual

- Run `smoke:production` and `smoke:rbac` after deploy with production credentials.
- Apply migrations `0020` and `0022` before certifying production healthy.
