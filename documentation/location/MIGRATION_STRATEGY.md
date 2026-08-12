# Migration Strategy

**Product version:** 1.8.0  
**Language:** British English

## Objectives

1. Introduce the new location master without destroying existing borrower/group history.
2. Preserve free-text location fields during cutover.
3. Backfill FK columns where names match.
4. Keep rollback possible until validation is complete.

## Forward path

1. Apply migration `0041_v180_location_master.sql`.
2. Import location master with `npm run seed:location-master -w @wilms/domain`.
3. Backfill relationships with `npm run db:backfill:locations -w @wilms/domain`.
4. Cut frontend selectors to region -> district -> community.
5. Prefer FK joins in reporting where available, while falling back to text fields.

## Table impact

| Table | Change | Compatibility |
|-------|--------|---------------|
| `regions`, `districts`, `communities` | New master tables | Additive |
| `pending_community_suggestions` | New workflow table | Additive |
| `location_sync_log` | New audit/import log | Additive |
| `borrowers` | Nullable location FKs | Text fields retained |
| `groups` | Nullable `community_id` | Text community retained |
| `collectors` | Nullable territory FKs | Text territory retained |
| `ghana_*` | Retained temporarily | Deprecated after validation |

## Rollback

1. Keep serving text fields if FK backfill quality is insufficient.
2. Retain old `/locations/districts/:id/cities` alias.
3. Do not drop `ghana_*` until validation evidence confirms parity.
4. Import and backfill scripts are additive and can be re-run after fixes.

## Safe database reset

To clear transactional data while preserving sign-in:

```bash
WILMS_CONFIRM_DB_RESET=YES npm run db:reset:keep-users -w @wilms/domain
```

Preserved tables:

- `users`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `user_permission_overrides`
- `__drizzle_migrations`
