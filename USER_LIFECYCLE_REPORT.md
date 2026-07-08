# User Lifecycle Report

**Release:** 1.2.2

## States

| Status | Meaning |
|--------|---------|
| INVITED | Account created; must complete onboarding |
| ACTIVE | Normal operation |
| SUSPENDED | Disabled by admin; sessions invalidated |

## Delete workflow

`DELETE /settings/users/:id` (via settings UI) calls `permanentlyDeleteUser()`:

1. Invalidate all sessions (`session_version` bump + auth artifact purge).
2. **INVITED users:** row removed from `users`.
3. **Other users:** row anonymized — email `deleted-{id}@purged.wilms.local`, unusable password hash, PII cleared, `deletedAt` set.

Audit entries referencing the user ID are retained for compliance.

## Suspend workflow

`POST /settings/users/:id/disable`:

1. Status → `SUSPENDED`.
2. Session version incremented.
3. Next API request returns `401` for existing cookies/tokens.

## Role change

`PATCH /settings/users/:id` with a new role invalidates sessions so permissions cannot lag behind token claims.

## Self-service protections

- Super admins cannot suspend themselves unless another active super admin exists.
- Users cannot delete their own account.
