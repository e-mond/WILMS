# RC1.2 ÔÇö Security

**Git SHA:** `e456febebf509d2672ea79741b6e9a59463de10d`  
**Date:** 2026-07-02T10:30:00Z  
**Branch:** `release/rc1-1-production-stabilization`  
**Commands run:**

```bash
npm audit --audit-level=critical
npm run smoke:rbac
# Code review: apps/backend/src/index.ts, apps/frontend/src/utils/apiClient.ts
```

**Result:** PASS

## npm audit

| Level | Count | Gate |
|-------|-------|------|
| Critical | **0** | PASS |
| High | 9 | Documented in `RC1.2-dependency-audit.md` |

## RBAC production smoke

```
WILMS_APP_URL=https://wilms.vercel.app
Passed: 11/11
```

Extends [`RC1.1-rbac-matrix.md`](RC1.1-rbac-matrix.md) ÔÇö collector self-access, admin-only routes, officer blocks.

## Controls verified

| Control | Location | Status |
|---------|----------|--------|
| Helmet (HSTS, hidePoweredBy) | `apps/backend/src/index.ts` | PASS |
| CORS | Backend index + BFF proxy | PASS |
| CSRF (double-submit cookie) | `apiClient.ts`, `/api/auth/login` | PASS |
| Per-route RBAC | Collector/reports/groups routers | PASS (RC1.1 hotfix) |
| Upload validation | Cloudinary provider + size checks | PASS |
| gitleaks | `.github/workflows/ci.yml` security job | PASS (CI) |

## OWASP mapping

| Risk | Control | Gap |
|------|---------|-----|
| Authn | HMAC session + login schema | ÔÇö |
| Authz | RBAC middleware + smoke matrix | ÔÇö |
| Injection | Zod validation + Drizzle parameterized queries | Drizzle advisory TD-02 |
| XSS | React escaping + CSP nonce (Next) | Monitor Next advisories TD-01 |
| CSRF | `wilms_csrf` cookie + header | ÔÇö |
| Uploads | Type/size limits, Cloudinary | ÔÇö |
| Session | Cookie flags, idle timeout, app lock | Server-side revocation **deferred** TD-04 |
| Rate limiting | Login rate limit | Global API limit **deferred** TD-03 |

## Pass gate

0 critical npm audit; smoke RBAC 11/11; no new P0/P1 findings.
