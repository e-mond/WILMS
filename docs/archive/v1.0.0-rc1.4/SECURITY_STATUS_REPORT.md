# WILMS — Security Status Report

**Audit date:** 2026-07-04 · **Commit:** `487708b`

---

## Authentication & session

| Control | Status | Evidence |
|---------|--------|----------|
| HMAC session cookie | Implemented | `/health` → `session.provider=hmac-signed-token` |
| HttpOnly session | Verified | Production smoke `session-cookie-httponly` PASS |
| Bcrypt passwords | Implemented | `apps/backend/src/lib/password.ts` |
| 24h expiry | Documented | `docs/security-guide.md` |
| Login via BFF | Working | Production smoke `bff-login` 200 |

---

## CSRF

| Control | Status | Evidence |
|---------|--------|----------|
| CSRF cookie + header | Implemented | `wilms_csrf` / `x-wilms-csrf` |
| Issuance endpoint | Working | `GET /api/auth/csrf` 200 |
| Blocks login without token | Verified | Production smoke `csrf-blocks-login-without-token` → 403 |
| BFF mutation protection | Documented | All `/api/wilms/*` POST/PATCH/DELETE |

---

## RBAC

| Control | Status | Evidence |
|---------|--------|----------|
| Role permissions matrix | Implemented | `packages/shared-rbac/src/role-permissions.ts` |
| Route-level enforcement | Implemented | All business modules |
| Production smoke | **11/11 PASS** | Admin/collector/officer scope checks |
| Unauthenticated API | 401 | Production smoke PASS |

---

## HTTP security headers & CORS

| Control | Status | Evidence |
|---------|--------|----------|
| Helmet | Implemented | Express app setup |
| CORS locked to frontend | Documented | `docs/security-guide.md` |
| Rate limiting | Platform-level | Railway/Vercel — **not independently tested** |

---

## Input validation & uploads

| Control | Status | Evidence |
|---------|--------|----------|
| Zod / shared-validation | Frontend + API | `packages/shared-validation` |
| Upload MIME allowlist | Implemented | Upload module |
| Size limits (~10 MB) | Documented | Security guide |
| Cloudinary production | **Configured** | `/health` → `uploads.cloudinaryConfigured=true` |
| Multipart upload | **Partial** | POST `/uploads` notes multipart not enabled |

---

## Dependency audit (`npm audit` — 2026-07-04)

| Package | Severity | Issue |
|---------|----------|-------|
| `dompurify` | Moderate | Trusted Types / ALLOWED_ATTR pollution (GHSA-vxr8, GHSA-cmwh) |
| `drizzle-orm` | **High** | SQL injection via identifiers (GHSA-gpj5) — fix in 0.45.2 (breaking) |
| `next` | **High** | Multiple DoS / SSRF / cache poisoning advisories — fix requires major bump |
| `playwright` / `uuid` (via exceljs) | High | SSL cert verification / uuid issues |

**Total:** 18 vulnerabilities (9 moderate, 9 high)

**Not run:** Dedicated SAST, penetration test, or Bugbot/security-review this audit.

---

## Secrets & credentials

| Item | Status |
|------|--------|
| `.env` in repo | Not committed (expected) |
| Demo credentials in smoke scripts | Hardcoded `*@wilms.demo` — acceptable for smoke only |
| Production secrets in Railway/Vercel | **Not inspected** (no dashboard access) |
| SMS/email env | Operator-configured; integration status in `/health` indirect via settings |

---

## Accessibility security (XSS surface)

Recent a11y changes removed conflicting `aria-label` on visible-text buttons — reduces screen-reader confusion; **no XSS impact**. Toast dismiss button accessible name now uses visible "Dismiss" text only.

---

## Findings summary

| Severity | Finding |
|----------|---------|
| **High** | Upgrade path needed for `drizzle-orm` and `next` CVEs |
| **Medium** | Production data row audit not completed |
| **Medium** | `/capture/[token]` middleware may block legitimate mobile upload flow |
| **Low** | `GET /locations/current` stub returns fixed coordinates |
| **Low** | Rate limit behavior not documented with thresholds |

---

## Recommendations

1. Schedule dependency upgrade sprint (drizzle 0.45.2+, Next 14.2.x/latest patched)  
2. Run `npm audit fix` for non-breaking items (dompurify)  
3. Re-run RBAC matrix against all 5 roles on staging before v1.0 tag  
4. Add security headers verification to production smoke  
5. Rotate demo passwords if exposed beyond internal ops
