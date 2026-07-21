# Final Role Acceptance Report

**Version:** 1.4.2 | **Date:** 2026-07-21 | **Phase:** 29

## Test Matrix

| Role | Positive tests | Negative / RBAC tests |
|------|----------------|----------------------|
| Super Admin | Dashboard, settings, ops | N/A (full access by design) |
| Collector | Portal access, dashboard utils | `collector-portal/rbac.test.ts`, `borrower-list-rbac.test.ts` |
| Registration Officer | Registration schema, officer routes | Financial endpoints denied |
| Auditor | Audit log read | No mutation endpoints |
| Approver | Approval flows | SoD self-approve blocked (7 workflows) |

## Authorization Boundaries Verified

| Check | Result |
|-------|--------|
| Horizontal privilege escalation (IDOR) | Backend object-level checks |
| Vertical privilege escalation | `requirePermission` on all sensitive routes |
| Self-approval (maker-checker) | 7 SoD regression tests |
| Permission overrides | `permission-overrides.test.ts` |
| Stale session permissions | Session invalidation on role change |

## UI Navigation

Navigation groups tested: `navigation-groups.test.ts`. Role-specific shells verified in layout tests.

## Live Walkthrough Gate

**BLOCKED** — each role must log into staging and complete primary workflows. Use `scripts/operator/run-staging-gates.sh` with optional role credentials.

## Status

**PASS (automated RBAC + SoD)** | Live walkthrough **BLOCKED**
