# WILMS v1.8.0 — RBAC Certification Report

**Generated (UTC):** 2026-08-09T19:27:00Z

## Verdict

**PASS (automated RBAC/SoD suites) — interactive multi-role UI walk BLOCKED**

## Automated evidence

From `evidence/financial-rbac-sod.log` + domain suite:

| Area | Evidence |
|------|----------|
| Financial endpoint RBAC | 7 tests PASS |
| Borrower list RBAC | 5 tests PASS |
| Collector portal RBAC | 6 tests PASS |
| SoD self-approve (borrower) | PASS |
| SoD self-review (reconciliation) | PASS |
| Additional SoD suites present | adjustments, expenses, loans, overpayment, sync (covered in full domain 250) |

## Roles (interactive production UI)

| Role | Navigation / forbidden / overrides | Status |
|------|--------------------------------------|--------|
| Super Admin | BLOCKED — no authenticated browser session | |
| Officer | BLOCKED | |
| Collector | BLOCKED | |
| Approver | BLOCKED | |
| Auditor | BLOCKED | |

## Close criteria

Login as each role on production/staging; capture screenshots of allowed nav and 403/hidden controls for forbidden actions; confirm maker-checker rejection messages.

## Security note

API protection is exercised by domain route tests; UI PermissionGate coverage is not re-proven interactively in this sprint.
