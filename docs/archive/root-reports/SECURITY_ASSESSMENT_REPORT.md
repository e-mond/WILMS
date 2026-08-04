# SECURITY_ASSESSMENT_REPORT.md

**Project:** WILMS  
**Date:** 2026-07-11  
**Scope:** Authentication, authorization, session management, input validation, infrastructure security

---

## 1. Authentication

| Control | Status | Evidence | Severity if missing |
|---------|--------|----------|---------------------|
| HMAC-signed session tokens | PASS | `authenticate.ts:36-99` | — |
| Timing-safe signature compare | PASS | `authenticate.ts:78-82` | — |
| bcrypt password hashing | PASS | `lib/password.ts` | — |
| HttpOnly session cookie (BFF) | PASS | `lib/auth/cookies.ts` | — |
| Login rate limiting | PASS | 20/15min `login-rate-limit.ts` | — |
| OTP verification flow | PASS | `auth/routes.ts:298-335` | — |
| Demo plaintext password fallback | PARTIAL | `password.ts` — non-bcrypt compare for legacy hashes | P2 |

---

## 2. Authorization (RBAC)

| Control | Status | Evidence |
|---------|--------|----------|
| Canonical permission matrix | PASS | `packages/shared-rbac/` |
| Backend `requirePermission` | PASS | `require-permission.ts` |
| Per-user permission overrides | PASS | `resolve-user-permissions.ts` |
| Collector IDOR protection | PASS | `collector-portal/access.ts` |
| Borrower access scoping | PASS | `borrowers/access.ts` |
| Frontend route guards | PASS | `middleware.ts`, `permission-matrix.ts` |
| Public route auth leak (capture) | **FAIL → FIXED** | Router order caused 401; also blocked legitimate public access |

---

## 3. Session Management

| Control | Status | Evidence | Fix |
|---------|--------|----------|-----|
| 24h session duration | PASS | `env.ts:36` | — |
| `session_version` invalidation | PASS | `session.service.ts` | — |
| Suspend → invalidate | PASS | `settings/service.ts:1152` | — |
| Role change → invalidate | PASS | `settings/service.ts:1141` | — |
| User purge → invalidate | PASS | `purge.service.ts:41` | — |
| Password reset → invalidate | **FAIL → FIXED** | Was missing in `password-reset.service.ts` | Added `invalidateUserSessions()` |
| Stateless logout | PASS | Cookie clear client-side | — |

**Verification:** `session-invalidation.test.ts` exists; password reset invalidation covered by code change (integration test not added — low risk).

---

## 4. CSRF

| Surface | Status | Evidence |
|---------|--------|----------|
| BFF auth routes | PASS | `rejectInvalidCsrf` on POST |
| BFF wilms proxy (general) | PASS | CSRF on mutating requests |
| Mobile capture upload | **FAIL → FIXED** | Exempt `photo-capture/sessions/*` — token-gated upstream |
| Direct Express API | N/A | No CSRF; relies on CORS + Bearer (BFF-only deployment assumed) |

CSRF cookie intentionally not HttpOnly (double-submit pattern): `lib/auth/csrf.ts`.

---

## 5. CORS

| Setting | Value | Risk |
|---------|-------|------|
| `origin` | `WILMS_CORS_ORIGIN` (single origin) | Low if configured correctly |
| `credentials` | `true` | Required for session cookies |

**Not verified—requires runtime:** Production `WILMS_CORS_ORIGIN` matches Vercel domain.

---

## 6. CSP / XSS

| Control | Status | Evidence |
|---------|--------|----------|
| Helmet CSP (production) | PASS | `app.ts:81-83` |
| React default escaping | PASS | JSX rendering |
| `dangerouslySetInnerHTML` | Not audited exhaustively | — |

---

## 7. SQL Injection

| Control | Status | Evidence |
|---------|--------|----------|
| Parameterized queries (Drizzle) | PASS | Repository pattern throughout |
| Raw SQL | Minimal — migrations only | — |

---

## 8. Rate Limiting

| Endpoint | Limit | File |
|----------|-------|------|
| Login | 20/15min | `login-rate-limit.ts` |
| Forgot password | 5/hour | `auth/routes.ts` |
| Reset password | 10/hour | `auth/routes.ts` |
| Verify OTP | 20/15min | `auth/routes.ts` |
| Service-level reset tokens | 5/user/hour | `password-reset.service.ts` |
| Global API | **Not present** | P2 — acceptable if API not publicly exposed |

---

## 9. Password Reset

| Control | Status | Evidence |
|---------|--------|----------|
| Token hashed (SHA-256) | PASS | `password-reset.service.ts:15-16` |
| Single-use tokens | PASS | `usedAt` column |
| 1-hour expiry | PASS | `TOKEN_EXPIRY_MS` |
| Anti-enumeration | PASS | Always `{ ok: true }` for unknown email |
| DB-less graceful degrade | PASS | Returns ok without DB on forgot |
| Session invalidation on reset | **FIXED** | `invalidateUserSessions(row.userId)` |

---

## 10. File Uploads

| Control | Status | Evidence |
|---------|--------|----------|
| MIME allowlist | PASS | `uploads/config.ts` |
| Size limit (10MB default) | PASS | `UPLOAD_MAX_SIZE_BYTES` |
| Purpose-based ACL | PASS | `uploads/routes.ts:47-82` |
| Mobile capture token gate | PASS | `photo-capture/routes.ts:98-106` |
| Capture upload auth exempt | PASS (by design) | Token is capability bearer |

---

## 11. User Lifecycle Security

| Scenario | Expected | Verified |
|----------|----------|----------|
| Deleted user cannot authenticate | Yes | `purge.service.ts` + user deletion — unit tests |
| Suspended user loses sessions | Yes | `settings/service.ts` + `assertSessionActive` |
| Blacklisted user loses sessions | Yes | Via status checks in session service |
| Password reset invalidates sessions | Yes (after fix) | Code change |
| Invited user → complete profile gate | Yes | `middleware.ts:80-84` |

---

## 12. Secrets Management

| Secret | Storage | Evidence |
|--------|---------|----------|
| `WILMS_SESSION_SECRET` | Env var, required in prod | `env.ts:12-14` |
| `DATABASE_URL` | Env var | Railway/Vercel |
| Cloudinary keys | Env var | `uploads/config.ts` |
| GitLeaks CI scan | PASS | `.github/workflows/ci.yml` security job |

---

## 13. Findings Summary

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| SEC-01 | P0 | Public capture API blocked by auth middleware | FIXED |
| SEC-02 | P1 | BFF CSRF blocked token-gated mobile upload | FIXED |
| SEC-03 | P1 | Password reset did not revoke sessions | FIXED |
| SEC-04 | P2 | No global API rate limit | OPEN |
| SEC-05 | P2 | Tracking redirect `?url=` open redirect risk | OPEN — `tracking/routes.ts` |
| SEC-06 | P2 | 15mb JSON body limit | ACCEPTED — needed for capture dataUrl |
| SEC-07 | P3 | Demo password hash fallback | OPEN — dev/demo only |

---

## 14. Verification Performed

- Static code review of auth, RBAC, CSRF, upload, and session modules
- `security-checks.ts` unit tests (part of backend 100/100)
- Production curl probe confirming 401 on public capture (pre-fix)
- Local reproduction and fix verification

**Not verified—requires runtime verification:**
- `smoke:rbac` against production (historically 7/8–11/11 depending on deploy)
- Penetration testing
- CSP violation reporting in production browser
