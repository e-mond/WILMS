# WILMS v1.8.1 — Final system audit matrix

**Branch:** `audit/v1.8.1-final-system-audit`  
**Baseline:** `0085c41` @ v1.8.1  
**Date:** 17 August 2026  

Columns: Area | Test | Expected | Actual | Status | Severity | Evidence | Fix

---

## Baseline and environment

| Area | Test | Expected | Actual | Status | Severity | Evidence | Fix |
|------|------|----------|--------|--------|----------|----------|-----|
| Deploy | Health version/SHA | 1.8.1 / 0085c41 | ok, matching SHA | VERIFIED | — | GET /api/wilms/health 17 Aug 2026 | — |
| DB | Migrations applied | expected = applied | expected 45, applied 44, countGap true | PARTIALLY VERIFIED | P2 | health.migrations | Ops review |
| Cron | Unauthenticated invoke | 401 | 401 | VERIFIED | — | curl probe | — |
| Cron | Schedule | 06:00 UTC daily | 0 6 * * * in vercel.json | VERIFIED | — | vercel.json | — |
| SMS | Provider configured | smsnotifygh | configured true | VERIFIED | — | health.integrations | — |
| Live SMS/cron | T-1 delivery | SMS sent once | Not observed | BLOCKED | — | Audit policy | Operator smoke |

---

## RBAC and routes

| Area | Test | Expected | Actual | Status | Severity | Evidence | Fix |
|------|------|----------|--------|--------|----------|----------|-----|
| Records search | Collector denied org search | 403 | Was allowed via REGISTER_BORROWERS | FIXED | P1 | records-routes-rbac.test.ts | V181-003 |
| SoD | Self-approve loan blocked | Validation error | Blocked except SA | VERIFIED | — | sod-self-approve.test.ts | — |

---

## Lifecycle

| Area | Test | Expected | Actual | Status | Severity | Evidence | Fix |
|------|------|----------|--------|--------|----------|----------|-----|
| Loan approve | No admin fee gate | Approve without fee | API yes; UI was blocked | FIXED | P1 | loan-approve-fee-gate.test.ts | V181-001 |
| Loan disburse | Admin fee required | assertAdminFeeRecorded | Enforced | VERIFIED | — | loans/service.ts | — |
| Pool capital | Lock at disburse | Row lock + check | Yes | VERIFIED | — | disburseLoan tx | — |

---

## Guarantor

| Area | Test | Expected | Actual | Status | Severity | Evidence | Fix |
|------|------|----------|--------|--------|----------|----------|-----|
| Cap | 4th non-leader blocked | AT_LIMIT | Blocked at 3 | VERIFIED | — | guarantor-eligibility.test.ts | — |
| Leader cap | 6th leader blocked at 5 | AT_LIMIT | Was always eligible | FIXED | P1 | guarantor-eligibility.test.ts | V181-004 |
| Missed SMS dedupe | One SMS per borrower | Single send | Daily repeat possible | FIXED | P1 | guarantor-missed-dedupe.test.ts | V181-002 |

---

## Notifications and settings

| Area | Test | Expected | Actual | Status | Severity | Evidence | Fix |
|------|------|----------|--------|--------|----------|----------|-----|
| T-1 SMS | Dedupe + Accra calendar | One SMS per loan/week | Code + tests | PARTIALLY VERIFIED | — | payment-scheduler.t1.test.ts | Live BLOCKED |
| Global SMS switch | Honest label | Global kill switch | Was mislabelled | FIXED | P2 | SettingsSectionViews | V181-005 |
| 2FA copy | All users | Label matches auth | Was SA-only text | FIXED | P2 | auth/routes.ts | V181-005 |

---

## Finance, location, security

| Area | Test | Expected | Actual | Status | Severity | Evidence | Fix |
|------|------|----------|--------|--------|----------|----------|-----|
| Allocation | Payment order | Domain rules | allocation.ts + tests | VERIFIED | — | financial-integrity tests | — |
| GhanaPost | Official API | Validated address | Plan only | NOT IMPLEMENTED | — | GHANAPOST plan | By design |
| CSRF | Auth mutations | Token required | Route handlers | VERIFIED | — | auth routes | — |

---

## Engineering gates

| Area | Test | Expected | Actual | Status | Severity | Evidence | Fix |
|------|------|----------|--------|--------|----------|----------|-----|
| type-check | npm run type-check | Pass | See final report | — | — | local/CI | — |
| domain tests | npm run test -w @wilms/domain | Pass | See final report | — | — | local/CI | — |
| build | npm run build | Pass | See final report | — | — | local/CI | — |
