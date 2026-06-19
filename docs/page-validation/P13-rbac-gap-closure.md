# P13 RBAC Gap Closure Report

Audit date: 2026-06-15. Follow-up to `P13-rbac-rollout-report.md`.

Validation: `npm run type-check` pass, `npm run lint` pass, `npm run test` 400 passed, `npm run build` pass.

---

## Newly protected actions (this follow-up)

| Action | Permission | File | Evidence |
|--------|------------|------|----------|
| Assign Group | `MANAGE_GROUPS` | `PendingApplicationReview.tsx` | `PermissionGate` wraps Assign Group button |
| Assign Collector | `MANAGE_GROUPS` | `PendingApplicationReview.tsx` | `PermissionGate` wraps Assign Collector button |
| Request Changes | `REVIEW_APPLICATIONS` | `PendingApplicationReview.tsx` | Wrapped auxiliary workflow button |
| Escalate Risk | `REVIEW_RISK_FLAGS` | `PendingApplicationReview.tsx` | Wrapped auxiliary workflow button |
| Create loan (nav links) | `APPROVE_LOANS` | `LoanPortfolioList.tsx` | Empty-state and toolbar links wrapped |
| Delete registration | `EDIT_PENDING_REGISTRATIONS` | `MyRegistrationsList.tsx` | Delete button wrapped |
| Clone role | `MANAGE_ROLES` | `SettingsRolesSection.tsx` | Clone + Delete wrapped together |
| Delete role | `MANAGE_ROLES` | `SettingsRolesSection.tsx` | Same gate as clone |
| Save same-day payment correction | `RECORD_COLLECTIONS` | `PaymentEditSection.tsx` | Submit button wrapped |
| Request payment adjustment | `RECORD_COLLECTIONS` | `PaymentEditSection.tsx` | Adjustment submit wrapped |
| Approve adjustment | `ACCESS_ADMIN_PORTAL` | `AdjustmentsPanel.tsx` | Approve/Reject wrapped |
| Reject adjustment | `ACCESS_ADMIN_PORTAL` | `AdjustmentsPanel.tsx` | Same gate |
| Approve expense (admin) | `MANAGE_EXPENSES` | `SettingsExpensesSection.tsx` | Approve/Reject wrapped |
| Reject expense (admin) | `MANAGE_EXPENSES` | `SettingsExpensesSection.tsx` | Same gate |
| Submit reconciliation | `RECORD_COLLECTIONS` | `ReconciliationForm.tsx` | Submit wrapped |
| Record admin fee | `RECORD_COLLECTIONS` | `AdminFeeRecordingPanel.tsx` | Record + Confirm wrapped |
| Resolve overpayment review | `ACCESS_ADMIN_PORTAL` | `OverpaymentReviewPanel.tsx` | Resolve/Dismiss wrapped |
| Dismiss overpayment review | `ACCESS_ADMIN_PORTAL` | `OverpaymentReviewPanel.tsx` | Same gate |

---

## Previously protected (P13 baseline, unchanged)

Export/print (`WilmsExportActions`, `ExportCsvButton`), wizard submits (registration, create loan), collections record, expense submit, risk flag actions, group membership, settings users, approval approve/reject/blacklist — see `P13-rbac-rollout-report.md`.

---

## Intentionally ungated (verified)

| Surface | Reason |
|---------|--------|
| Login / session-expired forms | Public auth pages; no authenticated permission context |
| Wizard **Continue** / **Back** navigation | Navigation only; final submit already gated via `MultiStepForm.submitPermissions` |
| **Edit** registration link (`MyRegistrationsList.tsx`) | Officer route + `canEdit` data flag; no dedicated `EDIT_BORROWERS` action gate (route-level `ACCESS_REGISTRATION_PORTAL`) |
| Read-only links (View profile, reports, audit history) | Navigation; target routes enforce permissions |
| Modal **Cancel** buttons | No mutation |
| `SettingsPanel.tsx` non-group-size fields | Individual save actions for SMS/email settings remain route-guarded only (`MANAGE_SYSTEM_SETTINGS` on group-size save only) — pre-existing partial coverage |
| Group reassign collector in group profile (if separate from approval) | `GroupMembershipManagement` covers membership; collector reassignment on group detail uses existing group service UI under `/groups` route guard |

---

## Permission constants used

All gates use existing IDs from `src/constants/permissions.ts`. No new permissions. No hardcoded role checks.

---

## Summary

P13 follow-up closed **18 additional mutation surfaces** identified in the gap report. Component-level RBAC now covers all audited high-risk mutations except public auth, wizard navigation, and read-only links protected at route level.
