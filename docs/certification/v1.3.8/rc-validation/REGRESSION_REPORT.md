# Regression Report — Phase 19.1

**Date:** 17 July 2026  
**Suites run (API):** financial-integrity-p0, reconciliation/*, health/*, financial-endpoints-rbac, empty-database list-handlers — **34/34 passed**  
**Frontend:** product-tour-routes — **3/3 passed**  
**Typecheck:** `tsc -p apps/backend` — clean

## Role coverage

| Role (product language) | Code reality | Regression evidence |
|---|---|---|
| Super Admin | `SUPER_ADMIN` | RBAC suite allows `/dashboard/summary` |
| Executive | UI label for Super Admin dashboards — **not a USER_ROLE** | N/A as separate role |
| Collector | `COLLECTOR` | Portal routes; SoD (no MANAGE_GROUPS); payment/recon binding |
| Registration Officer | `REGISTRATION_OFFICER` | `/officer/*` routes exist |
| Approver | `APPROVER` | `/approver/*` routes exist |
| Auditor | `AUDITOR` | `/auditor/*`; no ACCESS_ADMIN_PORTAL |
| Borrower | Domain entity — **no borrower portal role** | Expected; not a regression |
| Supervisor | Escalation concept — **not a USER_ROLE** | Super Admin receives recon alerts |

## Workflow checklist (code + tests; not live E2E)

| Area | Status | Evidence |
|---|---|---|
| Authentication | Pass | HMAC session; demo blocked in prod probes (prior audit) |
| Authorization | Pass | shared-rbac + requirePermission |
| Navigation / portals | Pass | App router groups per role |
| Collections / loans / disburse / pools | Pass | Service chains + integrity tests |
| Expenses | Pass | Ledger OPERATING_EXPENSE + dashboard netOperatingCash |
| Reconciliation | Pass after RC-01 fix | Routes + domain tests |
| Reports / dashboard | Pass | SQL KPI path when DB enabled |
| Audit logs | Pass | appendAuditEntry call sites |
| Settings / invites | Pass | Random invite passwords (prior) |
| Product Tour / Help | Pass | Tour 2.0 + route tests |
| Notifications / messaging | Pass (structure) | Modules present; delivery best-effort |
| Search / imports | Limited | No dedicated enterprise search — not a regression from Phase 18 |
| Exports | Present | Report export paths under admin reports |
| Profile | Present | complete-profile / settings pages |

## Regressions found

| ID | Severity | Notes |
|---|---|---|
| RC-01 | High → Fixed | Recon history IDOR |
| — | Critical | **None** |

## Not executed in this environment

- Authenticated production E2E against live Railway/Vercel  
- Browser matrix / device lab  
- 100k-row load test  

These are **coverage gaps**, not observed failures.
