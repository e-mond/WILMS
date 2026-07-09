# WILMS — Stage 1 Security Assessment

**Audit stage:** 1 (Security Review)  
**Date:** 2026-07-09  
**Repository:** `e-mond/WILMS`  
**Git ref audited:** `main` @ `cb2eb50` (includes Stage 0 `BASELINE.md` via PR #75)  
**Method:** Static code review of backend auth, RBAC, uploads, webhooks, tracking, and session handling; local in-process HTTP harness (`runSecurityChecks`); unauthenticated production probes against Railway API. **No code changes were made as part of this stage.**

**Scope note:** Findings below reflect the **repository codebase** at `cb2eb50`. Production runtime probes hit **deployed API v1.2.1** (see [Production drift](#production-drift-stage-0-carryover)), which lags `main` (v1.3.1, 21 migrations). Where production behavior differs or could not be exercised, items are listed under **Not Verified**.

---

## Executive summary

The API has a solid authentication and RBAC foundation: HMAC-signed sessions with timing-safe verification, session-version invalidation on role/status changes, permission middleware returning 401/403, login rate limiting, and an automated security harness that passed **11/11** checks locally.

Several **High**-severity issues were verified in code and (for three items) confirmed against production:

1. **Unauthenticated mail webhooks** can update delivery status (`/webhooks/mail/generic` always; `/webhooks/mail/resend` when `RESEND_WEBHOOK_SECRET` is unset).
2. **Open redirect** on email click tracking (`/tracking/click/:token/:linkId?url=…`).
3. **Password reset does not invalidate existing sessions** after a successful reset.

Additional **Medium** findings include plaintext password fallback, weak invitation-acceptance endpoint, and token-gated but unauthenticated photo-capture uploads.

---

## 1. Verified findings (static code review)

### HIGH

#### S1-H01 — Generic mail webhook accepts unauthenticated POSTs

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Location** | `apps/backend/src/modules/webhooks/routes.ts` L66–94 |
| **Description** | `POST /webhooks/mail/generic` has no signature, shared secret, or IP allowlist. Any caller can POST delivery events; when `messageId` matches a row, `updateDeliveryFromWebhook` mutates `messageDeliveries` status. |
| **Impact** | Spoofed delivery/bounce/complaint events; distorted email analytics and downstream notification state. |

#### S1-H02 — Resend webhook verification skipped when secret unset

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Location** | `apps/backend/src/modules/webhooks/routes.ts` L9–11, L43–46 |
| **Description** | `verifyResendSignature` returns `true` when `RESEND_WEBHOOK_SECRET` is missing (`if (!secret \|\| !signature) return !secret`). The route only rejects when the env var **is set** and verification fails. Unsigned payloads are accepted when the secret is absent. |
| **Impact** | Same as S1-H01 for Resend-originated traffic if production omits the secret. |

#### S1-H03 — Email click tracking open redirect

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Location** | `apps/backend/src/modules/tracking/routes.ts` L26–38; `apps/backend/src/infrastructure/notifications/email-tracking.ts` L94–133 |
| **Description** | `recordEmailClick` returns `input.destinationUrl` without validation. The route passes `req.query.url` directly (defaulting to `https://wilms.vercel.app` only when absent). |
| **Impact** | Phishing via `wilms-production…/tracking/click/…?url=https://evil.example` — users may trust the WILMS domain in the redirect chain. |

#### S1-H04 — Password reset does not revoke active sessions

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Location** | `apps/backend/src/modules/auth/password-reset.service.ts` L97–149 (no call to `invalidateUserSessions`); contrast `apps/backend/src/modules/auth/session.service.ts` L26–48 |
| **Description** | `resetPasswordWithToken` updates the password hash and marks the reset token used, but does not increment `users.sessionVersion`. Existing bearer/cookie sessions remain valid until natural expiry. |
| **Impact** | After a compromised-account password reset, an attacker with a stolen session token retains API access. `invalidateUserSessions` is used elsewhere (e.g. user purge, settings role changes) but not here. |

---

### MEDIUM

#### S1-M01 — Plaintext password comparison fallback

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Location** | `apps/backend/src/lib/password.ts` L11–16 |
| **Description** | If `storedHash` does not start with `$2`, `verifyPassword` compares plaintext `storedHash === password`. |
| **Impact** | Legacy or mis-seeded accounts with non-bcrypt hashes are vulnerable to offline DB disclosure; enables gradual migration but widens attack surface if any plaintext rows exist. |

#### S1-M02 — Accept-invitation endpoint lacks invitation token

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Location** | `apps/backend/src/modules/auth/routes.ts` L203–234 |
| **Description** | `POST /auth/accept-invitation` requires only `{ email }`. Anyone who knows or guesses an `INVITED` user's email can call the endpoint and transition `acceptedAt` / audit state without possessing an invitation secret. |
| **Impact** | Invitation workflow bypass for reconnaissance or premature state transition; does not alone grant a session (login still required) but weakens invitation integrity. |

#### S1-M03 — Photo capture upload is unauthenticated, token-only

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Location** | `apps/backend/src/modules/photo-capture/routes.ts` L70–112; `apps/backend/src/modules/photo-capture/service.ts` L30–31 |
| **Description** | `POST /photo-capture/sessions/:token/upload` has no `requireAuth`. Session token format: `pcs_` + 16 hex chars (~64 bits from UUID slice). Session creation (`POST /registration/capture-sessions`) correctly requires `CAPTURE_DOCUMENTS`. |
| **Impact** | Brute-force or leaked token allows uploading arbitrary files into WILMS storage and completing a capture session. Entropy is moderate, not cryptographically strong. |

#### S1-M04 — Cloudinary signed-upload params for any authenticated user

| Field | Detail |
|-------|--------|
| **Severity** | Medium (Low if Cloudinary folder/policy is tightly scoped) |
| **Location** | `apps/backend/src/modules/uploads/routes.ts` L86–109 |
| **Description** | `GET /uploads/signature` is behind `requireAuth` only (router-level L86), not a specific permission. Any logged-in role (including `COLLECTOR`) receives `apiKey`, `signature`, `timestamp`, and `folder`. |
| **Impact** | Authenticated users can obtain Cloudinary upload credentials and potentially upload outside intended UI flows, subject to Cloudinary account preset restrictions. |

---

### LOW / INFORMATIONAL

#### S1-L01 — Dual API mount expands attack surface

| Field | Detail |
|-------|--------|
| **Severity** | Informational |
| **Location** | `apps/backend/src/http/app.ts` L105–106 |
| **Description** | All business routes mount at `/api/v1` **and** at root (`''`). Webhooks, tracking, health, and auth are root-only. |
| **Impact** | Duplicate paths increase risk of misconfigured WAF/proxy rules; both prefixes must be secured consistently. |

#### S1-L02 — Development session secret default

| Field | Detail |
|-------|--------|
| **Severity** | Informational (dev only) |
| **Location** | `apps/backend/src/config/env.ts` L5–16 |
| **Description** | Non-production falls back to `wilms-dev-session-secret-change-me` if `WILMS_SESSION_SECRET` unset. Production throws if missing. |
| **Impact** | Predictable dev tokens if developers deploy without env; not applicable when production guard triggers. |

#### S1-L03 — Demo users with hardcoded passwords (no-DB mode)

| Field | Detail |
|-------|--------|
| **Severity** | Informational |
| **Location** | `apps/backend/src/seed/demo-users.ts` L12–40 |
| **Description** | Known demo credentials (e.g. `DemoAdmin1!`) used when database persistence is disabled. |
| **Impact** | Credential stuffing in misconfigured deployments that run without `DATABASE_URL` but expose the API publicly. |

#### S1-L04 — Public health endpoint information disclosure

| Field | Detail |
|-------|--------|
| **Severity** | Low / Informational |
| **Location** | `apps/backend/src/modules/health/health.service.ts` L35–71; `apps/backend/src/modules/health/routes.ts` L8–13 |
| **Description** | `/health` returns version, git commit, Node version, migration counts, upload provider status, schema table check results. |
| **Impact** | Aids attackers in targeting version-specific flaws; common for ops but verbose for a public endpoint. |

---

## 2. Verified positive controls

| Control | Evidence |
|---------|----------|
| HMAC-signed session tokens | `apps/backend/src/middleware/authenticate.ts` L36–38, L73–82 — `timingSafeEqual` on signature |
| Session revocation via `sessionVersion` | `apps/backend/src/modules/auth/session.service.ts` L51–88 — `assertSessionActive` checks version, role, status |
| RBAC middleware | `apps/backend/src/middleware/require-permission.ts` L5–22 — 401 without session, 403 without permission |
| Login rate limiting | `apps/backend/src/middleware/login-rate-limit.ts` L3–8 — 20 req / 15 min; `auth/routes.ts` L48–70 — forgot/reset/OTP limiters |
| Upload access control | `apps/backend/src/modules/uploads/routes.ts` L47–82 — owner check + role bypass for admin/approver/auditor/officer |
| Password reset token handling | `apps/backend/src/modules/auth/password-reset.service.ts` L19–23 — `timingSafeEqual` on token hash |
| Security headers (production) | `apps/backend/src/http/app.ts` L80–87 — Helmet CSP, HSTS, `no-referrer` |
| CORS restricted to configured origin | `apps/backend/src/http/app.ts` L90–94 |
| Frontend BFF CSRF on mutating routes | `apps/frontend/src/lib/auth/csrf-server.ts` L11–24; applied in `apps/frontend/src/app/api/wilms/[...path]/route.ts` L24–26 |
| Drizzle ORM parameterization | Repositories use tagged templates; no raw user input in `sql.raw` outside schema-health introspection |

---

## 3. Verified runtime findings

### 3.1 Local security harness — **11/11 PASS**

**Command:** `npx tsx` wrapper invoking `runSecurityChecks()` from `apps/backend/src/verification/security-checks.ts`  
**Environment:** In-process HTTP against `createApp()`, no `DATABASE_URL` (demo session user IDs used as fallbacks)  
**Date:** 2026-07-09

| Check | Result | Detail |
|-------|--------|--------|
| `unauthenticated-loans-blocked` | PASS | HTTP 401 |
| `expired-session-blocked` | PASS | HTTP 401 |
| `unsigned-forged-token-blocked` | PASS | HTTP 401 |
| `collector-cannot-approve-loan` | PASS | HTTP 403 |
| `collector-cannot-disburse` | PASS | HTTP 403 |
| `officer-cannot-post-payment` | PASS | HTTP 403 |
| `malformed-loan-create-rejected` | PASS | HTTP 422 |
| `collector-cannot-reverse-payment` | PASS | HTTP 403 |
| `collector-cannot-post-audit` | PASS | HTTP 403 |
| `auditor-can-post-audit` | PASS | HTTP 201 |
| `login-rate-limit-triggered` | PASS | HTTP 429 within 25 attempts |

Log: `/tmp/security-checks.log` in audit workspace.

### 3.2 Production probes (unauthenticated)

**Target:** `https://wilms-production.up.railway.app`  
**Deployed version:** v1.2.1 (per `/health`, 2026-07-09)

| Probe | HTTP | Evidence |
|-------|------|----------|
| `GET /health` | 200 | `version: "1.2.1"`, `migrations.expected: 17`, `session.provider: "hmac-signed-token"` |
| `GET /loans` | 401 | Unauthenticated access blocked |
| `POST /webhooks/mail/generic` body `{"provider":"audit-test","event":"delivered","messageId":"audit-fake-id-001"}` | 200 | `{"data":{"ok":true,"provider":"audit-test"}}` — **confirms S1-H01 on production** |
| `POST /webhooks/mail/resend` body `{"type":"email.delivered","data":{"email_id":"audit-fake-resend-001"}}` (no signature) | 200 | `{"data":{"ok":true}}` — **confirms S1-H02 behavior on production** (secret likely unset or bypassed) |
| `GET /tracking/click/testtoken/testlink?url=https://evil.example/phish` | 302 | `Location: https://evil.example/phish` — **confirms S1-H03 on production** |

---

## 4. Not verified

The following were **not** dynamically verified in this session, per audit constraints (no production credentials, no staging access, production version drift).

| Item | Reason |
|------|--------|
| IDOR across borrowers, loans, payments, uploads (authenticated) | Requires role-specific production or staging credentials |
| S1-H04 session persistence after password reset | Requires controlled user + session in a live DB |
| S1-M02 accept-invitation abuse | `POST /auth/accept-invitation` returned **401** on production v1.2.1 (route may differ from `main`; code review finding stands for current codebase) |
| S1-M03 photo-capture token brute-force | `GET /photo-capture/sessions/...` returned **401** on production v1.2.1 (feature likely absent or auth-wrapped in deployed build) |
| Resend webhook rejection when `RESEND_WEBHOOK_SECRET` **is** set | Cannot read production env |
| Cloudinary abuse via `/uploads/signature` | Requires authenticated session |
| BFF CSRF bypass against Vercel frontend | Smoke harness exists (`production-smoke.ts`) but was not run (needs frontend URL + credentials) |
| Staging environment | Not reachable per `BASELINE.md` Stage 0 |
| Offline client storage encryption | Out of backend API scope; noted in `SECURITY_REPORT.md` v1.3.0 recommendations |

---

## 5. Production drift (Stage 0 carryover)

| Attribute | Production (`/health`) | Repository `main` @ `cb2eb50` |
|-----------|------------------------|-------------------------------|
| API version | 1.2.1 | 1.3.1 (`apps/backend/package.json`) |
| Migrations | 17 applied | 21 files on disk |
| Git commit | `1f0b12f2…` | `cb2eb50` |

Security posture of production may differ until v1.3.x is deployed. Runtime probes above apply to **production v1.2.1**; code citations apply to **current `main`**.

---

## 6. Recommendations (no fixes applied in Stage 1)

| Priority | Recommendation | Related finding |
|----------|----------------|-----------------|
| P0 | Add shared-secret or HMAC signature verification to **all** mail webhooks; reject requests when secret is unset in production | S1-H01, S1-H02 |
| P0 | Validate `destinationUrl` against an allowlist of hosts/schemes before redirect; or use signed redirect tokens | S1-H03 |
| P0 | Call `invalidateUserSessions(userId)` inside `resetPasswordWithToken` after password update | S1-H04 |
| P1 | Require invitation token (or signed JWT) on `accept-invitation`; rate-limit endpoint | S1-M02 |
| P1 | Increase photo-capture token entropy (full UUID/v4) and/or require short-lived HMAC; consider rate limits on upload | S1-M03 |
| P1 | Restrict `/uploads/signature` to roles that need direct Cloudinary upload (e.g. `CAPTURE_DOCUMENTS`) | S1-M04 |
| P2 | Remove plaintext password fallback after migration audit; fail closed on non-bcrypt hashes | S1-M01 |
| P2 | Document or enforce single API prefix in reverse proxy; deprecate duplicate root mount | S1-L01 |
| P3 | Trim public `/health` fields for external callers or protect behind ops auth | S1-L04 |

---

## 7. Files reviewed (primary)

| Area | Paths |
|------|-------|
| App bootstrap | `apps/backend/src/http/app.ts` |
| Auth & sessions | `apps/backend/src/middleware/authenticate.ts`, `apps/backend/src/modules/auth/routes.ts`, `session.service.ts`, `password-reset.service.ts` |
| RBAC | `apps/backend/src/middleware/require-permission.ts`, `packages/shared-rbac/` |
| Webhooks & tracking | `apps/backend/src/modules/webhooks/routes.ts`, `apps/backend/src/modules/tracking/routes.ts`, `email-tracking.ts` |
| Uploads & capture | `apps/backend/src/modules/uploads/routes.ts`, `photo-capture/routes.ts`, `photo-capture/service.ts` |
| Config & secrets | `apps/backend/src/config/env.ts`, `apps/backend/src/seed/demo-users.ts` |
| Verification harness | `apps/backend/src/verification/security-checks.ts` |
| Frontend CSRF | `apps/frontend/src/lib/auth/csrf-server.ts`, `apps/frontend/src/app/api/wilms/[...path]/route.ts` |

---

## 8. Stage boundary

This deliverable completes **Stage 1 only**. Stages 2–8 and Stage 4.5 were not started. No remediation code was committed as part of this audit stage.

**Next stage:** Stage 2 — Role Certification → `ROLE_CERTIFICATION_REPORT.md`
