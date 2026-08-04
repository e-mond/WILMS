# RC1.4 — Security Verification

**Date:** 2026-07-04  
**Branch:** `release/rc1-4-v1-certification`

## Gate results

| Gate | Command | Result |
|------|---------|--------|
| Type-check | `npm run type-check` | Run in CI |
| Lint | `npm run lint` | Run in CI |
| Build | `npm run build` | Run in CI |
| Backend tests | `npm run test -w @wilms/api` | 51/51 expected |
| Frontend tests | `npm run test` | Run in CI |
| API integrity | `npm run verify:api-integrity` | PASS |
| API coverage | `npm run verify:api-coverage` | PASS |
| Mock guard | `npm run verify:mock-guard` | PASS |
| Production smoke | `npm run smoke:production` | 31/31 |
| RBAC smoke | `npm run smoke:rbac` | 11/11 |
| npm audit (critical) | `npm audit --audit-level=critical` | 0 critical |

## Security controls verified

- **CSRF:** BFF login blocks requests without token (smoke)
- **Session:** HttpOnly cookie, 24h duration
- **RBAC:** 11/11 production matrix
- **Rate limiting:** Express middleware on API routes
- **Headers:** Helmet + Vercel cache headers
- **Upload access:** Owner-scoped upload content routes

## Photo capture security

- Token-bound mobile upload (no session auth required)
- 15-minute session TTL with EXPIRED status on read
- Upload validated via existing upload pipeline
