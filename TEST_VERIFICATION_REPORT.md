# Test Verification Report — v1.2.1

**Date:** 2026-07-07  
**Branch:** `feature/v1.2.1-communication-stabilization`

| Command | Result |
|---------|--------|
| `npm run type-check` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run build` | **PASS** |
| `npm run test -w @wilms/api` | **65/65 PASS** |
| `npm run test -w @wilms/frontend` | **223/223 PASS** |
| `npm run smoke:production` | **31/31 PASS** |
| `npm run smoke:rbac` | **11/11 PASS** |

## New tests (v1.2.1)

- `apps/backend/src/tests/settings/invitation.test.ts`
  - Unique violation mapping
  - Invitation email template content

## Regression

All v1.2.0 communication platform tests remain green.
