# Security Audit Report — v1.3.7

**Date:** 2026-07-13  
**Scope:** v1.3.7 stable + production probe  
**Verdict:** **CONDITIONAL PASS** (automated); production auth smoke blocked

---

## Production probe results

| Control | Test | Result |
|---------|------|--------|
| CSRF enforcement | POST `/api/auth/login` without token | **PASS** — HTTP 403 |
| CSRF with token | Token cookie issued on `/api/auth/csrf` | **PASS** |
| Unauthenticated API | GET `/loans` on Railway | **PASS** — HTTP 401 |
| Demo credentials disabled | `admin@wilms.demo` login | **PASS** — HTTP 401 (expected in prod) |
| Health disclosure | `/health` payload | **PASS** — no secrets in response |
| Session provider | Health `session.provider` | **PASS** — `hmac-signed-token` |
| Upload config | Cloudinary validated | **PASS** |
| HTTPS | Production URLs | **PASS** — TLS enforced |

---

## Code-level controls (verified)

| Control | Location | Status |
|---------|----------|--------|
| Production mock guard | `config/mock-guard.ts` | PASS — exits if mock flags in production |
| Mock import guard | `verify:mock-guard` | PASS |
| Next.js mock bundling | `next.config.mjs` | PASS — mock disabled in production builds |
| Financial RBAC | `financial-endpoints-rbac.test.ts` | PASS |
| Collector portal RBAC | `collector-portal/rbac.test.ts` | PASS |
| Session invalidation | `session-invalidation.test.ts` | PASS |
| Health no secrets | `health.service.test.ts` | PASS |

---

## OWASP-oriented review

| Category | Assessment | Notes |
|----------|------------|-------|
| Authentication | PASS (code) | BFF session cookies; demo creds rejected in prod |
| Authorization | PASS (unit tests) | Role gates on financial and collector routes |
| Rate limiting | **NOT TESTED** | No load test in agent |
| Session management | PARTIAL | HMAC sessions; expiry tests exist locally |
| CSRF | PASS (prod probe) | BFF enforces `x-wilms-csrf` |
| XSS | **NOT PENETRATION TESTED** | React escaping; no manual XSS probe |
| SQL injection | **NOT PENETRATION TESTED** | Drizzle ORM parameterized queries |
| Sensitive data exposure | PASS (health) | Degraded reasons contain no secrets |
| File uploads | PARTIAL | Cloudinary configured; upload smoke blocked |
| Secrets in repo | PASS | `.env.example` only; no live secrets in git |
| JWT / cookies | PARTIAL | HttpOnly session not verified (login failed) |
| CORS | **NOT TESTED** | |
| Security headers | **NOT TESTED** | HSTS observed on Vercel |

---

## Critical vulnerabilities

**None identified** in automated scope.

---

## Residual risk

1. Run `smoke:production` with real credentials to confirm HttpOnly session cookies.
2. Run `smoke:rbac` to confirm role denial on production.
3. Apply pending migrations — schema gaps may affect authorization paths for advanced lending features.
4. Optional: third-party penetration test before public launch.

---

## Verdict

No critical security regressions found in code review or unauthenticated production probes. **Full production security certification requires authenticated smoke tests and optional penetration testing.**
