# Test Verification Report

**Release:** 1.2.2  
**Date:** 2026-07-08

## Commands

| Command | Result |
|---------|--------|
| `npm run type-check` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run build` (frontend) | **PASS** |
| `npm run test -w @wilms/api` | **76/76 PASS** |
| `npm run test -w @wilms/frontend` | **225/225 PASS** (shard 1/2 sequential) |

## New tests (v1.2.2)

| File | Coverage |
|------|----------|
| `apps/backend/src/tests/transactions/admin-fee-workflow.test.ts` | Login gate false; per-borrower fee idempotency |
| `apps/backend/src/tests/auth/session-invalidation.test.ts` | Token session version; DB invalidation |
| `apps/backend/src/tests/users/user-purge.test.ts` | Permanent delete invited users |

## Smoke suites

Run after deploy:

```bash
npm run smoke:production
npm run smoke:rbac
```

## Regression focus

- Login and collector dashboard flows unchanged (no admin-fee redirect).
- Existing invitation, communication, and payment tests remain green on API package.
