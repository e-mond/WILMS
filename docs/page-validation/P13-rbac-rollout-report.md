# P13 RBAC Rollout Report

Audit date: 2026-06-09. Permission IDs sourced exclusively from `src/constants/permissions.ts`. No new permissions were added in P13.

Validation: `npm run test` — 400 tests passed (2 shards × 200). `npm run build` — success.

---

## Route-level protection (unchanged from P12)

| Portal | Guard | Permission(s) | Evidence |
|--------|-------|---------------|----------|
| Super Admin | `RoleGuard` → `PermissionRouteGuard` | `ACCESS_ADMIN_PORTAL` | `src/app/(super-admin)/layout.tsx` |
| Collector | same | `ACCESS_COLLECTOR_PORTAL` | `src/app/(collector)/layout.tsx` |
| Registration Officer | same | `ACCESS_REGISTRATION_PORTAL` | `src/app/(registration-officer)/RegistrationOfficerLayoutClient.tsx` |
| Approver | same | `ACCESS_APPROVER_PORTAL` | `src/app/(approver)/layout.tsx` |
| Auditor | same | `ACCESS_AUDITOR_PORTAL` | `src/app/(auditor)/layout.tsx` |

Path and nav filtering: `ROUTE_PERMISSION_REQUIREMENTS` and `NAV_ITEM_PERMISSIONS` in `src/lib/rbac/permission-matrix.ts`; consumed by `canAccessPathWithPermissions` and `useFilteredNavItems`.

---

## P13 `PermissionGate` expansion

P12 baseline: 2 files, 6 action gates (`context/page-validation/P12-rbac-audit.md`).

P13 adds component-level gates in **16 consumer files** (grep `PermissionGate` under `src/`):

| File | Permission(s) | Actions gated |
|------|---------------|---------------|
| `WilmsExportActions.tsx` | `permissions` prop (default `[EXPORT_REPORTS]`) | Export CSV/Excel/PDF, Print |
| `ExportCsvButton.tsx` | `permissions` prop (default `[EXPORT_REPORTS]`) | CSV export |
| `MultiStepForm.tsx` | `submitPermissions` prop | Final wizard submit |
| `BorrowerProfileActions.tsx` | `EXPORT_REPORTS` | Export/print borrower profile |
| `BorrowerRegistrationWizard.tsx` | `REGISTER_BORROWERS` via `submitPermissions` | Submit registration |
| `CreateLoanWizard.tsx` | `APPROVE_LOANS` via `submitPermissions` | Create loan submit |
| `MyRegistrationsList.tsx` | `EXPORT_REPORTS`, `REGISTER_BORROWERS` | Export my registrations |
| `PendingApplicationReview.tsx` | `APPROVE_BORROWERS`, `REJECT_LOANS`, export permissions | Approve, Reject, Blacklist, export |
| `GroupProfileActions.tsx` | `EXPORT_REPORTS` + `MANAGE_GROUPS`, `MANAGE_GROUPS` | Export, Flag group |
| `GroupMembershipManagement.tsx` | `MANAGE_GROUPS` | Add/remove/transfer/replace leader |
| `GroupDisplayNameSection.tsx` | `MANAGE_GROUPS` | Update display name (P12) |
| `PaymentEntryPanel.tsx` | `RECORD_COLLECTIONS` | Record payment submit |
| `CollectorExpenseForm.tsx` | `RECORD_EXPENSES` | Submit expense |
| `RiskFlagsPanel.tsx` | `REVIEW_RISK_FLAGS` | Resolve/dismiss actions |
| `RiskFlagsAsidePanel.tsx` | `REVIEW_RISK_FLAGS` | Resolve/dismiss actions |
| `SettingsPanel.tsx` | `MANAGE_SYSTEM_SETTINGS` | Save group-size settings |
| `SettingsUsersSection.tsx` | `MANAGE_USERS` | Invite user (P12) |
| `SettingsUserModal.tsx` | `MANAGE_USERS`, `EDIT_USERS`, `ACTIVATE_USERS`, `SUSPEND_USERS` | Create/edit/suspend/activate |
| `SettingsUserProfileModal.tsx` | `RESET_PASSWORD`, `RESET_PIN`, `FORCE_LOGOUT`, `SUSPEND_USERS`, `ENABLE_MFA` | Admin user actions (P12) |

`PermissionGate` test compatibility: uses `useOptionalPermissionContext()` — renders children when no provider (`src/components/auth/PermissionGate.tsx`, `src/components/providers/PermissionProvider.tsx`).

---

## Domain action matrix

Legend: **Gated** = `PermissionGate` or export wrapper; **Route** = portal/route guard only; **Gap** = no component gate found.

### Borrowers

| Action | Permission | Protection | Evidence |
|--------|------------|------------|----------|
| View list/profile | `ACCESS_ADMIN_PORTAL` | Route | `/borrowers` routes |
| Export/print profile | `EXPORT_REPORTS` | **Gated** | `BorrowerProfileActions.tsx` L90–140 |
| Edit borrower | `EDIT_BORROWERS` | Route | No edit UI gate audited |

### Groups

| Action | Permission | Protection | Evidence |
|--------|------------|------------|----------|
| View/manage | `MANAGE_GROUPS` | Route + partial gates | `/groups` routes |
| Export profile | `EXPORT_REPORTS`, `MANAGE_GROUPS` | **Gated** | `GroupProfileActions.tsx` L64–68 |
| Flag group | `MANAGE_GROUPS` | **Gated** | `GroupProfileActions.tsx` L69–73 |
| Membership changes | `MANAGE_GROUPS` | **Gated** | `GroupMembershipManagement.tsx` L129–167 |
| Update display name | `MANAGE_GROUPS` | **Gated** | `GroupDisplayNameSection.tsx` |

### Loans

| Action | Permission | Protection | Evidence |
|--------|------------|------------|----------|
| View portfolio | `ACCESS_ADMIN_PORTAL`, `APPROVE_LOANS` | Route | `permission-matrix.ts` |
| Export portfolio CSV | `EXPORT_REPORTS` | **Gated** | `ExportCsvButton` default in `LoanPortfolioList.tsx` L183–199 |
| Create loan (wizard submit) | `APPROVE_LOANS` | **Gated** | `CreateLoanWizard.tsx` L219–220 |
| Create loan (nav link) | `APPROVE_LOANS` | **Gap — Route only** | `LoanPortfolioList.tsx` L104–109, L200–205 — plain `<Link>` |

### Collections

| Action | Permission | Protection | Evidence |
|--------|------------|------------|----------|
| Record payment | `RECORD_COLLECTIONS` | **Gated** | `PaymentEntryPanel.tsx` L239–253 |
| Edit same-day payment | `RECORD_COLLECTIONS` (implied) | **Gap — Route only** | `PaymentEditSection.tsx` — no `PermissionGate`; parent route is collector portal |
| Request adjustment | collector portal | Route | `PaymentEditSection.tsx` L175–184 |

### Expenses

| Action | Permission | Protection | Evidence |
|--------|------------|------------|----------|
| Submit expense | `RECORD_EXPENSES` | **Gated** | `CollectorExpenseForm.tsx` L126–130 |

### Risk & Flags

| Action | Permission | Protection | Evidence |
|--------|------------|------------|----------|
| Review/resolve | `REVIEW_RISK_FLAGS` | **Gated** | `RiskFlagsPanel.tsx`, `RiskFlagsAsidePanel.tsx` |

### Reports

| Action | Permission | Protection | Evidence |
|--------|------------|------------|----------|
| View reports | `VIEW_REPORTS`, etc. | Route | `/reports` routes |
| Export/print | `EXPORT_REPORTS` | **Gated** | `WilmsExportActions.tsx`, `ExportCsvButton.tsx` |

### Users & Settings

| Action | Permission | Protection | Evidence |
|--------|------------|------------|----------|
| Invite user | `MANAGE_USERS` | **Gated** | `SettingsUsersSection.tsx` |
| Create/edit user | `MANAGE_USERS`, `EDIT_USERS` | **Gated** | `SettingsUserModal.tsx` |
| Suspend/activate | `SUSPEND_USERS`, `ACTIVATE_USERS` | **Gated** | `SettingsUserModal.tsx`, `SettingsUserProfileModal.tsx` |
| Reset password | `RESET_PASSWORD` | **Gated** | `SettingsUserProfileModal.tsx` L194–198 |
| Reset PIN | `RESET_PIN` | **Gated** | `SettingsUserProfileModal.tsx` L199–203 |
| Save system settings | `MANAGE_SYSTEM_SETTINGS` | **Gated** | `SettingsPanel.tsx` L178–187 |
| Clone/delete role | `MANAGE_ROLES` | **Gap — Route only** | `SettingsRolesSection.tsx` L65–81 — no `PermissionGate` |

### Registration

| Action | Permission | Protection | Evidence |
|--------|------------|------------|----------|
| Submit registration | `REGISTER_BORROWERS` | **Gated** | `BorrowerRegistrationWizard.tsx` L394 |
| Export registrations | `EXPORT_REPORTS`, `REGISTER_BORROWERS` | **Gated** | `MyRegistrationsList.tsx` L212–217 |
| Delete registration | `EDIT_PENDING_REGISTRATIONS` | **Gap — Route only** | `MyRegistrationsList.tsx` L114–126 — `handleDelete` with no gate |

### Approval

| Action | Permission | Protection | Evidence |
|--------|------------|------------|----------|
| Approve | `APPROVE_BORROWERS` | **Gated** | `PendingApplicationReview.tsx` L431–449 |
| Reject | `REJECT_LOANS` | **Gated** | `PendingApplicationReview.tsx` L451–469 |
| Blacklist | `APPROVE_BORROWERS` | **Gated** | `PendingApplicationReview.tsx` L503–521 |
| Export review pack | `EXPORT_REPORTS`, `REVIEW_APPLICATIONS` | **Gated** | `PendingApplicationReview.tsx` L284 |
| Assign group | `MANAGE_GROUPS` (closest existing) | **Gap — Route only** | `PendingApplicationReview.tsx` L329–369 — ungated button |
| Assign collector | `MANAGE_GROUPS` or admin | **Gap — Route only** | `PendingApplicationReview.tsx` L379–419 — ungated button |
| Request changes / Escalate risk | `REVIEW_APPLICATIONS` | **Gap — Route only** | `PendingApplicationReview.tsx` L471–501 |

### Adjustments (Super Admin)

| Action | Permission | Protection | Evidence |
|--------|------------|------------|----------|
| Approve/reject adjustment | `ACCESS_ADMIN_PORTAL` | **Gap — Route only** | `src/features/adjustments/` — no `PermissionGate` matches |

---

## Summary

| Metric | P12 | P13 |
|--------|-----|-----|
| Files with `PermissionGate` | 2 | 16 (+ component definition) |
| Export/print actions gated | No | Yes (centralized in export components) |
| Wizard submits gated | No | Yes (registration, create loan) |

**Remaining component-level gaps (verified):**

1. Assign Group / Assign Collector — `PendingApplicationReview.tsx`
2. Create loan navigation links — `LoanPortfolioList.tsx`
3. Delete registration — `MyRegistrationsList.tsx`
4. Role clone/delete — `SettingsRolesSection.tsx`
5. Payment same-day edit — `PaymentEditSection.tsx`
6. Adjustment approve/reject — adjustments panels
7. Approval workflow auxiliary buttons (Request Changes, Escalate Risk)

All gaps remain protected at route/portal level for roles that should not reach those pages; component gates would enforce fine-grained RBAC when permission overrides are introduced.
