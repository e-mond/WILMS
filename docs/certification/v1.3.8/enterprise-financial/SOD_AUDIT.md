# Separation of Duties (SoD) Audit

**Date:** 17 July 2026

## Role matrix (post-remediation)

| Capability | Collector | Officer | Approver | Auditor | Super Admin |
|---|---|---|---|---|---|
| Record collections | ✓ | — | — | — | ✓ |
| Manage groups | **✗ removed** | — | — | — | ✓ |
| Approve loans | ✗ | ✗ | ✓ | ✗ | ✓ |
| Review reconciliations | ✗ | ✗ | ✗ | **✗** | ✓ (`ACCESS_ADMIN_PORTAL`) |
| Record expenses | ✓ (own) | — | — | — | ✓ |
| Reverse payments | ✗ | ✗ | ✗ | ✗ | ✓ |
| View reports | ✗ | ✗ | ✗ | ✓ | ✓ |
| Assign permissions | ✗ | ✗ | ✗ | ✗ | ✓ |

## Fixes applied

1. **H-03** — Reconciliation review no longer uses `VIEW_REPORTS` (Auditor).
2. **H-04** — `MANAGE_GROUPS` removed from Collector in `@wilms/shared-rbac` and frontend `rbac-roles.ts`.
3. **C-02** — Loan create cannot jump to disbursement without approval transition.
4. Super Admin retains override paths; actions write audit entries.

## Residual SoD notes

- Same Super Admin may still both approve and disburse if dual-control staffing is not operationally enforced — recommend four-eyes policy outside the product for large disbursements.
- Permission overrides for Super Admin remain possible by design; all overrides must stay audited.
