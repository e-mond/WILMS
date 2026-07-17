# Security & Operational Signoff — WILMS v1.3.8 Production Cutover

**Date:** 17 July 2026  
**Phase:** 23  
**Scope:** Public probe evidence + documented security posture  
**Formal security sign-off:** **Pending**

---

## Summary

| Area | Result |
|------|--------|
| Security headers (API) | **Complete** |
| HSTS (frontend) | **Complete** |
| CSP (API) | **Complete** |
| CORS restricted to production origin | **Complete** |
| Anonymous `/ops/metrics` blocked | **Complete** (401) |
| Request ID tracing (`X-Request-Id`) | **Complete** |
| Frontend auth redirect (`/ops` → 307) | **Complete** |
| CSRF endpoint available | **Complete** |
| Authenticated RBAC smoke (prod) | **Pending** |
| Metrics scrape with token | **Pending** |
| Penetration test / external audit | **Pending** |
| Named Security Owner signature | **Pending** |

---

## API response headers (production probe)

**Source:** `evidence/api-headers-20260717T193511Z.txt`  
**Endpoint:** `GET https://wilms-production.up.railway.app/health`

| Control | Header | Value | Status |
|---------|--------|-------|--------|
| HSTS | `strict-transport-security` | `max-age=31536000; includeSubDomains` | **Complete** |
| CSP | `content-security-policy` | `default-src 'self'`; restrictive script/style/img | **Complete** |
| MIME sniffing | `x-content-type-options` | `nosniff` | **Complete** |
| Referrer | `referrer-policy` | `no-referrer` | **Complete** |
| Clickjacking | `x-frame-options` | `SAMEORIGIN` | **Complete** |
| COOP | `cross-origin-opener-policy` | `same-origin` | **Complete** |
| CORP | `cross-origin-resource-policy` | `same-origin` | **Complete** |
| Download | `x-download-options` | `noopen` | **Complete** |
| XSS (legacy) | `x-xss-protection` | `0` (modern browsers rely on CSP) | **Noted** |
| Request tracing | `x-request-id` | `c3e974d2-e573-42f7-939f-d27274b7fa90` | **Complete** |
| CORS origin | `access-control-allow-origin` | `https://wilms.vercel.app` | **Complete** |
| CORS credentials | `access-control-allow-credentials` | `true` | **Complete** (paired with specific origin) |

---

## Frontend headers (production probe)

**Source:** `evidence/frontend-headers-20260717T193511Z.txt`  
**Endpoint:** `GET https://wilms.vercel.app/login`

| Control | Header | Value | Status |
|---------|--------|-------|--------|
| HSTS + preload | `strict-transport-security` | `max-age=63072000; includeSubDomains; preload` | **Complete** |
| Cache | `cache-control` | `private, no-cache, no-store, max-age=0, must-revalidate` | **Complete** |

---

## Authentication & authorization

| Check | Method | Result | Status |
|-------|--------|--------|--------|
| Anonymous metrics denied | `GET /ops/metrics` → 401 | ~0.11s | **Complete** |
| Ops UI requires auth | `GET /ops` → 307 | Redirect to login | **Complete** |
| CSRF token endpoint | `GET /api/auth/csrf` → 200 | `{"ok":true}` expected | **Complete** |
| Demo accounts disabled on prod | Smoke negative test | Not executed | **Pending** |
| RBAC per-role enforcement | `smoke:rbac` | Not executed | **Pending** |
| Session provider | Health: `hmac-signed-token` | Configured | **Complete** (config only) |

---

## Credential audit (security-relevant)

**Source:** `evidence/credential-audit-20260717T193511Z.txt`

| Secret | Status | Security note |
|--------|--------|---------------|
| `WILMS_SMOKE_EMAIL/PASSWORD` | **UNSET** | Blocks prod auth smoke |
| `WILMS_METRICS_TOKEN` | **UNSET** | Blocks metrics scrape verification |
| `DATABASE_URL` | **UNSET** | Blocks DB-level security queries |
| `RAILWAY_TOKEN` / `VERCEL_TOKEN` | **UNSET** | Blocks env export audit |

---

## Operational security controls (Pending)

| Control | Evidence required | Status |
|---------|-------------------|--------|
| Production env secret audit (redacted export) | Railway + Vercel screenshots | **Pending** |
| No demo passwords in prod DB | SQL or admin check | **Pending** |
| GitHub Actions deploy secrets audit | Signed checklist | **Pending** |
| Alert on auth anomaly / 5xx spike | Alert delivery log | **Pending** |

---

## Software track reference

Phases 21–22 closed software security gates:

- Targeted API security tests in unit suite (IDOR, session, upload, webhook)
- Public header and anon-auth enforcement verified this session

---

## Sign-off block

| Role | Name | Date | Status |
|------|------|------|--------|
| Security Owner | — | — | **Pending** |
| Engineering Lead | — | — | **Pending** |

**Security operational signoff:** **Pending** — public controls verified; authenticated and human closure items open.

**Cutover posture:** **⚠ READY WITH CONDITIONS**
