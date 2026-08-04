# RC1 Registration Hardening

## Borrower ID formats

| ID type | Display format | Stored normalized |
|---------|----------------|-------------------|
| Ghana Card | `GHA-XXXXXXXXX-X` | Uppercase with hyphens |
| Voter ID | `XXXXXXXXXX` or `XXXX-XXXX-XXXX` | Uppercase, no spaces |
| Passport | 6–9 alphanumeric characters | Uppercase, no spaces |

Shared validators live in `packages/shared-validation/src/borrower-id.schema.ts` and are enforced on both the registration wizard and `POST /borrowers`.

## GPS / location

- **Regions/districts/cities:** `GET /locations/*` (authenticated; registration portal permissions).
- **Use current location:** browser `navigator.geolocation` in production `locationService`; backend `/locations/current` is fallback only.
- **Offline fallback:** if regions API fails, the wizard uses the static Ghana reference list.

## Loading policy

| Threshold | UI |
|-----------|-----|
| &lt; 300ms | No skeleton/spinner |
| 300ms – 30s | Skeleton or inline loader |
| &gt; 30s | Timeout message + Retry |

Constants: `apps/frontend/src/constants/loading-policy.ts`  
Hook: `apps/frontend/src/hooks/useQueryLoadingPolicy.ts`  
Route transition bar remains ~280ms (`RouteTransitionLoader`).

## Production demo data cleanup

Remove seeded demo borrowers/loans/pools (`01930001-*`, `01930002-*`, `01930003-*`):

```bash
# Dry-run (default)
node apps/backend/scripts/cleanup-demo-financial-data.mjs

# Execute deletions
node apps/backend/scripts/cleanup-demo-financial-data.mjs --execute
```

Prevent re-seeding in production:

- `npm run db:seed:reference` — RBAC + adjustment reasons only (safe)
- `npm run db:seed:demo` — demo financial data (blocked when `NODE_ENV=production` unless `ALLOW_DEMO_SEED=true`)

## Production smoke

Extended checks in `apps/backend/src/verification/production-smoke.ts`:

- `GET /api/wilms/reports/hub` returns `categoryBreakdown` + `scheduledReports` arrays
- Optional officer role: set `WILMS_SMOKE_OFFICER_EMAIL` + `WILMS_SMOKE_OFFICER_PASSWORD` to probe `/locations/regions`
