# Navigation Audit — v1.4.1

**Date:** 2026-07-18  
**Author:** WILMS Engineering

## Critical bug (fixed)

`/ops` was absent from `ROUTE_PERMISSION_REQUIREMENTS`. Middleware treated the path as inaccessible and redirected Super Admin to `/dashboard`, while the sidebar still showed **Operations**.

### Fix

- Added `/ops` → `ACCESS_ADMIN_PORTAL | MANAGE_SYSTEM_SETTINGS`
- Added `NAV_ITEM_PERMISSIONS['/ops']`
- Distinct breadcrumbs/titles
- Renamed workflow group label to **Daily Operations**
- Tests: `dashboard-ops-routes.test.ts`

## Intended IA

| Route | Purpose |
|-------|---------|
| `/dashboard` | Executive KPIs / portfolio overview |
| `/ops` | Platform control centre (health, queues, workers, runtime) |

## Verification

- `canRoleAccessPath(SUPER_ADMIN, '/ops') === true`
- Nav hrefs differ
- Command palette lists both destinations
- Tour includes Operations step
