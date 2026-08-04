# Test Verification Report — v1.3.0

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

## Results (v1.3.0 branch)

| Suite | Result |
|-------|--------|
| Type check | Pass |
| Lint | Pass |
| Build | Pass |
| API tests | 83/83 pass |
| Frontend tests | 230+ per shard (12GB heap recommended) |
| smoke:production | Requires production URL |
| smoke:rbac | Requires live API |

## New Tests (v1.3.0)

- `apps/backend/src/tests/lending/advanced-lending.test.ts`
- `apps/frontend/src/tests/field-operations/device-management.test.ts`

## Prior release tests (retained)

- Invitation lifecycle, session invalidation, user purge, admin fees, mail dispatch, sync constants

## Documentation verified

- `README.md`, `PROJECT_STATUS.md`, `CHANGELOG.md`
- `docs/offline-architecture.md`, `docs/synchronization-guide.md`
- `docs/device-management.md`, `docs/mobile-guide.md`, `docs/advanced-lending.md`
- `docs/api-overview.md`, `docs/deployment-guide.md`, `docs/production-guide.md`
