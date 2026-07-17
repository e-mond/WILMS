# Security Signoff — WILMS v1.3.8 Go-Live

**Date:** 17 July 2026  
**Scope:** Public probe evidence + local automated security tests  
**Formal sign-off:** **Pending** (no named approver signature on file)

---

## Summary

| Area | Result |
|------|--------|
| Security headers (API) | **PASS** (probe evidence) |
| HSTS (frontend) | **PASS** |
| CORS restricted to production origin | **PASS** |
| Anonymous `/ops/metrics` blocked | **PASS** (401) |
| Request ID tracing | **PASS** |
| Targeted security API tests (local) | **PASS** (part of 36/36 suite) |
| Authenticated RBAC smoke (prod) | **Pending** |
| Penetration test / external audit | **Pending** |
| Named security approver signature | **Pending** |

---

## API response headers (production probe)

**Source:** `evidence/api-response-headers.txt`  
**Endpoint:** `GET https://wilms-production.up.railway.app/health`

| Control | Header | Value | Status |
|---------|--------|-------|--------|
| HSTS | `strict-transport-security` | `max-age=31536000; includeSubDomains` | **PASS** |
| CSP | `content-security-policy` | `default-src 'self'`; restrictive script/style/img | **PASS** |
| MIME sniffing | `x-content-type-options` | `nosniff` | **PASS** |
| Referrer | `referrer-policy` | `no-referrer` | **PASS** |
| Clickjacking | `x-frame-options` | `SAMEORIGIN` | **PASS** |
| COOP | `cross-origin-opener-policy` | `same-origin` | **PASS** |
| CORP | `cross-origin-resource-policy` | `same-origin` | **PASS** |
| Download | `x-download-options` | `noopen` | **PASS** |
| XSS (legacy) | `x-xss-protection` | `0` (modern browsers rely on CSP) | **Noted** |
| Request tracing | `x-request-id` | `2b563520-3bb1-45af-9b4b-dbbc993add17` | **PASS** |
| CORS | `access-control-allow-origin` | `https://wilms.vercel.app` | **PASS** |
| Credentials | `access-control-allow-credentials` | `true` | **PASS** (paired with specific origin) |

---

## Frontend headers (production probe)

**Source:** `evidence/frontend-response-headers.txt`  
**Endpoint:** `GET https://wilms.vercel.app/login`

| Control | Header | Value | Status |
|---------|--------|-------|--------|
| HSTS + preload | `strict-transport-security` | `max-age=63072000; includeSubDomains; preload` | **PASS** |
| Cache | `cache-control` | `private, no-cache, no-store, max-age=0, must-revalidate` | **PASS** |

---

## Authentication & authorization

| Check | Method | Result |
|-------|--------|--------|
| `/ops/metrics` without credentials | Public curl | HTTP **401** — **PASS** |
| CSRF endpoint available | `GET /api/auth/csrf` | HTTP 200 `{"ok":true}` — **PASS** |
| Session provider | Health payload | `hmac-signed-token` — **PASS** (configured) |
| RBAC enforcement (prod, all roles) | `smoke:rbac` | **Pending** |
| IDOR / recon history (code) | RC validation fix | Documented upstream — not re-tested live |

---

## Local automated security coverage

From `evidence/local-gates.txt`:

- Targeted API tests include **security** module: **PASS** (36/36 aggregate)
- `verify:mock-guard` — ensures no production mock leakage: **PASS**
- API path integrity — no orphaned frontend routes: **PASS**

Upstream depth: `docs/certification/v1.3.8/enterprise-excellence/SECURITY_HARDENING_REPORT.md`, `docs/certification/v1.3.8/enterprise-financial/IDOR_REVIEW.md`

---

## Integration secrets (configured, not exposed)

From health payload — confirms providers are set without revealing credentials:

| Integration | Provider | Configured |
|-------------|----------|------------|
| Mail | Gmail | ✓ |
| SMS | smsnotifygh | ✓ |
| Uploads | Cloudinary | ✓, valid |

**Secret rotation audit:** **Pending** — no vault checklist attached.

---

## Accepted residual risks (v1.3.8)

Documented upstream, not introduced in Phase 22:

| Risk | Posture |
|------|---------|
| In-process queue | Accepted until v1.4 durable workers |
| Optional Idempotency-Key | Accepted |
| HTTP-triggered scheduler | Accepted |
| Demo password fallback | N/A in production DB mode (real users) |

---

## Pending for formal security signoff

| # | Item | Status |
|---|------|--------|
| 1 | Authenticated RBAC smoke on production | **Pending** |
| 2 | Production login rate-limit manual verification | **Pending** |
| 3 | Password reset enumeration test | **Pending** |
| 4 | Secrets audit (Railway + Vercel) | **Pending** |
| 5 | Named Security Owner signature | **Pending** |

---

## Signoff block

| Role | Name | Date | Signature | Status |
|------|------|------|-----------|--------|
| Security Owner | — | — | — | **Pending** |
| Release Manager | — | — | — | **Pending** |

---

## Verdict

**Technical security controls (headers, anon auth enforcement, local security tests): PASS** based on captured evidence.

**Formal security signoff: Pending** — requires operator checklist completion and named approval in [FINAL_RELEASE_APPROVAL.md](./FINAL_RELEASE_APPROVAL.md).
