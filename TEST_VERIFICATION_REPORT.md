# WILMS v1.1.3 — Test Verification Report

**Version:** `1.1.3`  
**Date:** 2026-07-07

## Command results

| Command | Result |
|---------|--------|
| `npm run type-check` | ✅ PASS |
| `npm run lint` | ✅ PASS |
| `npm run build` | ✅ PASS |
| `npm run test -w @wilms/api` | ✅ 57/57 (15 files) |
| `npm run test -w @wilms/frontend` | ✅ 223/223 (81 files) |

## New tests

| Suite | Tests |
|-------|-------|
| `email-layout.test.ts` | 4 (branded HTML, buttons, password reset, welcome) |
| `templates.test.ts` | 6 (existing, still passing with new engine) |

## Backend test breakdown

15 test files, 57 tests — all pass including new notification tests.

## Frontend test breakdown

81 test files, 223 tests — all pass, no regressions.

## Smoke tests

Run against production after deploy:
```bash
WILMS_APP_URL=https://wilms.vercel.app WILMS_API_URL=https://wilms-production.up.railway.app npm run smoke:production
npm run smoke:rbac
```

## Areas verified

- Email template engine renders branded HTML
- All template builders produce valid subject/text/html
- Communication Center page builds without errors
- RBAC permissions compile across shared-rbac and frontend
- Domain service notification wiring type-checks
- No regressions in existing test suites

## Post-deploy manual checks

1. Navigate to Communication Center as super admin
2. Compose and send test broadcast
3. Verify delivery logs populate
4. Trigger loan approval → check collector inbox
5. Disable user → verify account disabled email
