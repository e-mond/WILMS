# WILMS API Overview

**Version:** 1.3.0  
**Base URL (production):** `https://wilms-production.up.railway.app`

The frontend BFF proxies authenticated requests to the API via `/api/wilms/*`.

## Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Email + password |
| POST | `/auth/verify-otp` | 2FA verification |
| POST | `/auth/complete-onboarding` | Invited user profile setup |
| POST | `/auth/accept-invitation` | Record invitation acceptance |
| POST | `/auth/forgot-password` | Request reset email |
| POST | `/auth/reset-password` | Complete password reset |

Session: HMAC-signed cookie with `sessionVersion` for invalidation.

## Core Domains

| Domain | Prefix | Notes |
|--------|--------|-------|
| Borrowers | `/borrowers` | Registration, approval, profiles |
| Loans | `/loans` | Lifecycle, schedule, progress |
| Payments | `/payments` | Collections, reversals |
| Groups | `/groups` | Group lending |
| Collectors | `/collectors` | Performance, assignments |
| Settings | `/settings` | Users, roles, system config |
| Communications | `/communications` | Broadcasts, templates, analytics |
| Sync | `/sync` | Offline batch + conflict resolution |
| Uploads | `/uploads` | Cloudinary-backed files |

## Offline Sync (v1.3.0)

```
POST /sync/offline/batch
GET  /sync/conflicts
POST /sync/conflicts/:id/approve
POST /sync/conflicts/:id/reject
```

## Readable IDs

API responses include `displayId` fields where applicable (borrowers, collectors, loans, payments, users). Internal UUIDs remain for foreign keys.

## Error Format

```json
{
  "message": "Human-readable error",
  "code": "VALIDATION"
}
```

## Health

```
GET /health
```

## Migrations

Run from monorepo root:

```bash
npm run db:migrate -w @wilms/api
```

Latest: `0020_v130_field_operations.sql` (cadence, holidays, fees, penalties).

## Related

- [Authentication](./authentication.md)
- [Synchronization Guide](./synchronization-guide.md)
- [Deployment Guide](./deployment-guide.md)
