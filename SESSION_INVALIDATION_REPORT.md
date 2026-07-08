# Session Invalidation Report

**Release:** 1.2.2

## Mechanism

WILMS uses stateless HMAC-signed session cookies. v1.2.2 adds a server-side `session_version` counter per user.

### Token payload

```json
{
  "userId": "...",
  "role": "COLLECTOR",
  "displayName": "...",
  "expiresAt": 1730000000000,
  "status": "ACTIVE",
  "sessionVersion": 3
}
```

### Validation (`requireAuth`)

1. Verify HMAC signature and expiry.
2. Load user from database.
3. Reject if `deletedAt` is set.
4. Reject if `status === SUSPENDED`.
5. Reject if `session.sessionVersion !== users.session_version`.
6. Reject if `session.role !== users.role`.

### Triggers

| Event | Action |
|-------|--------|
| Suspend user | `session_version++` |
| Delete user | `session_version++` then purge |
| Role change | `session_version++` |
| Status change | `session_version++` |

## Frontend behaviour

When the API returns `401`, the BFF and `apiClient` clear the session and redirect to `/login` or `/session-expired`.

## Limits

- No server-side session table (stateless design retained).
- Invalidation is immediate on the next request, not via websocket push.
- Tokens without `sessionVersion` default to version `1` for backward compatibility during rollout.
