# Roles & Permissions Bugfix Report

## Reported Issues

| Issue | Reported | Root Cause | Fix |
|---|---|---|---|
| Clone role 422 | `POST /settings/roles/:id/clone` | Unique constraint on `roles.name` — repeated “{Name} Copy” | Generate unique names (`Copy`, `Copy 2`, …) |
| Delete role 404 | `POST /settings/roles/:id/delete` | Valid 404 for missing IDs; missing UX on frontend | Confirmed route works; added delete confirmation + error toast |

## Reproduction (local, in-memory API)

```bash
# Login → clone twice → second clone returns 201 with "Collector Copy 2"
# Delete cloned role → 200 { ok: true }
# Delete missing role → 404
```

Automated: `apps/backend/src/tests/settings/roles-routes.test.ts` (3 tests)

## Additional Fixes

- Mock store clone uses same unique naming logic.
- DB seed now inserts `role_permissions` for system roles so clones inherit permissions in database mode.

## Frontend

- Clone failure shows “Unable to clone role” toast.
- Delete requires confirmation dialog before mutation.
