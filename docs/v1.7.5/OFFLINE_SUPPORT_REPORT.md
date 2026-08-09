# WILMS v1.7.5 — Offline Support Report

## Status

Complete — Phase B (field-critical).

## Delivered

- SW cache bumped to `wilms-v175-shell` with broader shell routes for all roles
- Offline queue type `HOLIDAY_REQUEST_CREATE` + sync handler + domain batch apply
- `AppOfflineShell` in root layout (banner + retry for all roles)
- Sync status panel helpers; conflict review remains at `/approver/sync-conflicts`
- IndexedDB snapshot helper for dashboard (stale-while-revalidate on fetch failure)
- Collector holiday form queues drafts/submits while offline

## Non-goals (unchanged)

- Full offline CRUD for every module/page
