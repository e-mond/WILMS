# WILMS Security Guide

**Last updated:** P14.5G (v0.2.1)

---

## Authentication

- HMAC-signed session tokens in HttpOnly cookie `wilms_session`
- Bcrypt password hashing
- 24-hour session expiry
- Cookie flags: `Secure` (production), `SameSite=Lax`, `HttpOnly`

---

## CSRF (BFF Layer)

All browser mutations through the Next.js BFF require synchronizer tokens:

| Component | Value |
|-----------|-------|
| Cookie | `wilms_csrf` (non-HttpOnly, readable by JS) |
| Header | `x-wilms-csrf` |
| Issuance | `GET /api/auth/csrf` |
| Validation | BFF compares cookie === header |

Protected routes: `/api/auth/login`, `/api/auth/logout`, `/api/wilms/*` (POST/PATCH/DELETE).

Client code: `authService.ensureCsrfToken()` before login; `apiClient` adds header on mutations.

---

## API Security (Express)

- Helmet middleware (CSP, HSTS, frame guard, nosniff)
- CORS locked to production frontend origin
- RBAC on all business routes
- Rate limiting via infrastructure (Railway/Vercel)

Direct API calls require session cookie; browser traffic should use BFF.

---

## Upload Security

- Server-side MIME allowlist
- Size limits (default 10 MB)
- Cloudinary in production (no local disk persistence)

---

## Secrets

Never commit: `.env*`, `.wilms-production-credentials.json`, session secrets, DB URLs.

Rotate: `WILMS_SESSION_SECRET`, production user passwords via `rotate-production-users.mjs`.

---

## Audits

- `docs/page-validation/P14.5G-security-audit.md`
- `docs/page-validation/P14.5F-security-review.md`
