# RC1.1 ÔÇö RBAC Matrix

**Date:** 2026-07-01  
**Branch:** `release/rc1-1-production-stabilization`

## Expected 403 (correct RBAC)

| Endpoint | Permission | COLLECTOR | REGISTRATION_OFFICER | APPROVER |
|----------|------------|-----------|----------------------|----------|
| `GET /dashboard/summary` | `ACCESS_ADMIN_PORTAL` | 403 | 403 | 403 |
| `GET /settings/users` | `VIEW_ALL_USERS` | 403 | 403 | 403 |
| `GET /collectors` (mgmt list) | `VIEW_ALL_COLLECTORS` | 403 | 403 | 403 |
| `GET /borrowers/:id/disbursement-eligibility` | `APPROVE_LOANS` | 403 | 403 | varies |

## Expected 200 (role-appropriate)

| Endpoint | Role | Status |
|----------|------|--------|
| `GET /dashboard/summary` | SUPER_ADMIN | 200 |
| `GET /settings/users` | SUPER_ADMIN | 200 |
| `GET /collector/:ownId/dashboard` | COLLECTOR (self) | 200 |
| `GET /reconciliation` | COLLECTOR | 200 |
| `GET /notifications/inbox/unread-count` | Any authenticated | 200 |
| `POST /registration/capture-sessions` | COLLECTOR (with `CAPTURE_DOCUMENTS`) | 201 |

## Defect 403 (fixed in hotfix `8e0df23`)

Router-level `requirePermission` on early-mounted routers blocked unrelated paths. Example: collectors router `use(VIEW_ALL_COLLECTORS)` caused 403 on `/notifications/*` for collectors.

**Fix:** Per-route guards only.

## Verification

```bash
WILMS_APP_URL=https://wilms.vercel.app npm run smoke:rbac -w @wilms/api
```

Automated probes: admin 200 on dashboard/settings; collector 403 on admin routes; collector 200 on own dashboard + reconciliation.
