# Administrator Guide (Super Admin) — WILMS v1.3.8

**Role:** Super Admin  
**Portal:** Admin shell (all portals)  
**Permission:** All permissions via `packages/shared-rbac`

## 1. Responsibilities

- User lifecycle: invite, suspend, role assign, password reset, MFA policy
- System settings: org profile, fees, holidays, lockout policy, notification defaults
- Financial oversight: loan pools, capital, expenses, reconciliations, adjustments (with SoD)
- Operations: production health via **Operations** (`/ops`)
- Communications: broadcasts, templates, scheduler
- Security: audit log review, reconciliation approval, risk flags

## 2. Daily tasks

| Task | Where |
|------|-------|
| Check operations dashboard | `/ops` → Refresh; investigate Degraded surfaces |
| Review failed communications | Communications → delivery logs |
| Monitor negative cash alert | `/ops` financial summary |
| Triage user access requests | Settings → Users |

## 3. User management

| Action | Path | Notes |
|--------|------|-------|
| Invite user | Settings → Users → Invite | Email via configured mail provider |
| Change role | Users → Edit | Invalidates active sessions |
| Suspend | Users → Suspend | Immediate session invalidation |
| Reset password | Users → Reset password | User receives reset flow |
| Force logout | Users → Force logout | Bumps session version |

**Production:** Demo accounts (`@wilms.demo`) are not used — only real invited users in the database.

## 4. Financial operations

| Task | Path |
|------|------|
| Loan pools / capital | Loan Pools |
| Reconciliation review | Reconciliations (requires admin portal) |
| Adjustments | Financial adjustments — approval chain |
| Expenses | Manage expenses / approve collector expenses |
| Reports | Dashboard + financial reports + exports |

**Rules:** No manual balance entry. Adjustments require documented reason and approval.

## 5. Operations dashboard (`/ops`)

Super Admin only. Shows:

- Deployment version, git commit, Node version
- Health status and degraded reasons
- Financial snapshot (capital, collections, outstanding, net operating cash)
- Integration surfaces: database, email, SMS, storage, workers
- Worker note: Redis not used; in-process queue in v1.3.8

Does **not** show secrets or env values.

API equivalent: `GET /api/v1/ops/status` (via BFF).

## 6. Settings reference

| Section | Purpose |
|---------|---------|
| Organization | Name, contact, branding |
| Security | Session, lockout (`failed_login_lockout_attempts`) |
| Fees & penalties | Admin fee, late payment rules |
| Holidays | Organization holidays affecting schedules |
| Notifications | Default channels |
| Roles | Permission reference (read-only matrix) |

## 7. Incident support

As L1/L2 for production:

1. Check `/ops` and public API `/health`
2. Collect `X-Request-Id` from affected user
3. Escalate per [INCIDENT_RESPONSE_PLAYBOOK.md](./INCIDENT_RESPONSE_PLAYBOOK.md)

## 8. Permissions highlight

Unique to Super Admin: `access-admin-portal`, `manage-system-settings`, `manage-users`, `assign-roles`, `manage-communications`, reconciliation mutation.

See [permission-matrix.md](../../../permission-matrix.md).

## 9. Related docs

- [PRODUCTION_OPERATIONS_MANUAL.md](./PRODUCTION_OPERATIONS_MANUAL.md)
- [OPERATIONS_DASHBOARD_SPEC.md](./OPERATIONS_DASHBOARD_SPEC.md)
- [PRODUCTION_SUPPORT_MANUAL.md](./PRODUCTION_SUPPORT_MANUAL.md)
