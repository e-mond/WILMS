# WILMS Security Guide

**Last updated:** 2026-07-05 (v1.0.1 maintenance)

## Current controls

| Area | Control |
|------|---------|
| Authentication | HMAC-signed session flow with bcrypt password verification |
| Browser session | HttpOnly cookies and CSRF protection through the BFF flow |
| RBAC | Shared role/permission constants and backend permission middleware |
| Headers | Helmet on the API |
| Rate limiting | Express rate-limit middleware |
| Uploads | MIME/size validation and Cloudinary-backed production storage |
| Audit trail | Backend audit entries for sensitive workflows |

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