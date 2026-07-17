# Permission Override Architecture

## Effective Permission Resolution

```
effective = (role permissions from user_roles + role_permissions)
          ∪ (user grants where granted=true)
          \ (user revocations where granted=false)
```

Backend resolver: `apps/backend/src/infrastructure/permissions/resolve-user-permissions.ts`

## API (v1.3.8)

| Method | Path | Permission |
|---|---|---|
| GET | `/settings/users/:id/permission-overrides` | `assign-permissions` |
| PUT | `/settings/users/:id/permission-overrides` | `assign-permissions` |
| POST | `/settings/users/:id/permission-overrides/:permissionId/delete` | `assign-permissions` |

## Conflict Rules

- Cannot **grant** a permission already provided by the user's role.
- **Revoke** applies only to permissions present via role.
- Invalid permission IDs → 422.

## Audit

Each grant/revoke/remove writes an audit entry:

- `PERMISSION_OVERRIDE_GRANTED`
- `PERMISSION_OVERRIDE_REVOKED`
- `PERMISSION_OVERRIDE_REMOVED`

## UI

Super Admin manages overrides in **Settings → Users → User Profile → Individual Permission Overrides**.

Component: `SettingsUserPermissionOverrides.tsx`

## Schema

Table: `user_permission_overrides` (existing migration `0000_init.sql`)
