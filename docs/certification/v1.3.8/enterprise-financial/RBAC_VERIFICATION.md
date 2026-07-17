# RBAC Verification

**Date:** 17 July 2026  
**Source of truth:** `packages/shared-rbac` → backend `PERMISSION` matrix → route `requirePermission`

## Server-side enforcement points verified

| Area | Permission / gate |
|---|---|
| Payments POST | `RECORD_COLLECTIONS` + borrower assignment for collectors |
| Payments PATCH | 409 immutable (no silent edit) |
| Payment reverse | `ACCESS_ADMIN_PORTAL` |
| Loan approve | `APPROVE_LOANS` (existing) |
| Loan disburse | lifecycle + admin fee + pool capital (service) |
| Recon review | `ACCESS_ADMIN_PORTAL` |
| Groups mutate | `MANAGE_GROUPS` (Collector no longer holds) |
| Expenses list | Collectors scoped to own `recordedByUserId` |
| Dashboard summary | Admin portal financial permission (existing RBAC tests) |

## Regression tests

- `apps/backend/src/tests/enterprise/financial-integrity-p0.test.ts` — Collector lacks `MANAGE_GROUPS`; Auditor lacks `ACCESS_ADMIN_PORTAL`
- Existing `financial-endpoints-rbac.test.ts` / collector portal RBAC suites remain the HTTP-level gate

## Mock vs live

Frontend PermissionGate is cosmetic. All money and SoD controls above are enforced in Express services/routes regardless of mock UI mode.
