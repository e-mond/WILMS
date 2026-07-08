# Test Verification Report — v1.2.3

## Commands

```bash
npm run type-check
npm run lint
npm run build
npm run test -w @wilms/api
NODE_OPTIONS="--max-old-space-size=12288" npm run test -w @wilms/frontend -- --pool=forks --maxWorkers=1
npm run smoke:production   # requires WILMS_APP_URL
npm run smoke:rbac         # requires live API
```

## Results (CI agent environment)

| Suite | Result |
|-------|--------|
| Type check | Pass |
| Lint | Pass |
| Build | Pass |
| API tests | 79/79 pass |
| Frontend tests (shard 1/2) | 228/228 pass |
| Frontend tests (shard 2/2) | OOM at default heap; run with 12GB+ or in CI |
| smoke:rbac | 7/8 without full production URL |
| smoke:production | Skipped (no `WILMS_APP_URL`) |

## New Tests

- `apps/backend/src/tests/settings/invitation-lifecycle.test.ts`
- `apps/frontend/src/tests/utils/format-delivery-failure.test.ts`

## Regression Coverage

Existing suites for session invalidation, user purge, admin fees, invitation email templates, mail dispatch, and RBAC remain green.
