# WILMS Security Guide

**Last updated:** 2026-07-08 (v1.2.2)

## Current controls

| Area | Control |
|------|---------|
| Authentication | HMAC-signed session flow with bcrypt password verification |
| Session invalidation | `users.session_version` bumped on suspend, delete, or role change |
| Browser session | HttpOnly cookies and CSRF protection through the BFF flow |
| RBAC | Shared role/permission constants and backend permission middleware |
| Headers | Helmet on the API |
| Rate limiting | Express rate-limit middleware |
| Uploads | MIME/size validation and Cloudinary-backed production storage |
| Audit trail | Backend audit entries for sensitive workflows |
| User deletion | Invited users hard-deleted; active users anonymized with credentials removed |

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
| Password reset | Token table; tokens purged on user deletion |
| 2FA OTP | Optional; OTP challenges purged on user deletion |

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