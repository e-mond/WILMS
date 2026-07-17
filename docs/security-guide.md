# WILMS Security Guide

**Last updated:** 2026-07-17 (v1.3.8)

> Prefer current ops/security procedures in [`certification/v1.3.8/production-operations/`](./certification/v1.3.8/production-operations/) and [`permission-matrix.md`](./permission-matrix.md). This guide retains field-security detail; version stamp aligned to v1.3.8.

## Current controls

| Area | Control |
|------|---------|
| Authentication | HMAC-signed session flow with bcrypt password verification |
| Session invalidation | `users.session_version` bumped on suspend, delete, role change, or password reset |
| Browser session | HttpOnly cookies and CSRF protection through the BFF flow |
| RBAC | Shared role/permission constants and backend permission middleware |
| Headers | Helmet on the API |
| Rate limiting | Express rate-limit middleware |
| Uploads | MIME/size validation and Cloudinary-backed production storage |
| Audit trail | Backend audit entries for sensitive workflows |
| User deletion | Invited users hard-deleted; active users anonymized with credentials removed |
| Offline sync | Financial offline mutations require approver review before posting |
| Field device | App lock PIN stored locally; upload queue in IndexedDB on device |
| Mobile photo capture | Token-gated public API routes; no session auth required on mobile |

## Offline & field security (v1.3.0)

- Offline payment batches are ingested but not auto-applied; approvers must approve at `/approver/sync-conflicts`.
- Service worker caches shell assets only; API calls require valid session.
- Upload queue blobs remain on-device until successfully uploaded.
- Battery saver mode pauses background sync to reduce exposure window on low power.

## User lifecycle

- **Suspend / disable:** status set to `SUSPENDED`, sessions invalidated immediately.
- **Delete:** invited users removed permanently; active users anonymized (email, password, PII scrubbed) while audit references remain.
- **Role change:** sessions invalidated; user must sign in again.

## Authentication flows

| Flow | Behaviour |
|------|-----------|
| Login | Issues signed token with `sessionVersion` |
| Protected API | `requireAuth` validates signature, expiry, status, and session version |
| Logout | Client clears cookie; server stateless |
| Password reset | Token table; sessions invalidated on successful reset; tokens purged on user deletion |
| 2FA OTP | Optional; OTP challenges purged on user deletion |

## CSRF and public routes

The BFF applies double-submit CSRF on mutating `/api/wilms/*` requests. Exceptions:

| Path | Reason |
|------|--------|
| `photo-capture/sessions/*` | Mobile capture clients have no session cookie; upload is token-gated on the API |

Direct Express API calls do not use CSRF; they rely on CORS and Bearer tokens. Production deployments should route browser traffic through the Vercel BFF.

## Required checks

```bash
npm audit --omit=dev
npm run verify:mock-guard
npm run smoke:rbac
npm run smoke:production
```

## Known dependency risks

Remaining advisories after non-breaking audit cleanup require breaking upgrades:

- `next` and transitive `postcss`
- `drizzle-orm`
- `@playwright/test` / `playwright`
- `exceljs` / transitive `uuid`

These should be fixed in a dedicated hardening PR with full migration, build, E2E, export, and smoke validation.

## Secrets

Secrets belong in `.env` locally or in Railway/Vercel/GitHub secrets. Never commit `.env`, credentials JSON, API keys, or production tokens.

## Historical security reports

Pre-v1.0 security audits are archived under `docs/archive/`.