# Documentation vs implementation audit — WILMS v1.8.1

**Branch:** `audit/v1.8.1-final-system-audit`  
**Baseline SHA:** `0085c41fa0ed97d8a2f5181bbbdf37f625afe9d4` (PR #209)  
**Date:** 17 August 2026  
**Scope:** Product Book, BRD, ops, notifications, location, finance docs vs repository code  
**Policy:** Local/preview evidence only; no production data mutation  

Status labels: **VERIFIED** / **PARTIALLY VERIFIED** / **NOT VERIFIED** / **BLOCKED** / **FAILED** / **NOT IMPLEMENTED** / **IMPLEMENTED BUT BROKEN** / **INCONSISTENT**

---

## Executive summary

Most core lifecycle and financial rules are implemented and covered by automated tests. Documentation is broadly aligned on registration → approval → loan → admin fee → disbursement → repayments, but several settings labels, notification matrices, and location claims overstate what the code enforces. GhanaPost GPS remains planning-only. Live T-1 SMS cron execution and operator UI smoke are **BLOCKED** by audit policy, not by missing code.

---

## Product Book / BRD

| Claim (documentation) | Code reality | Status | Evidence |
|----------------------|--------------|--------|----------|
| Five operational roles with RBAC | Implemented in `@wilms/shared-rbac`, frontend `permission-matrix.ts`, domain `requirePermission` | **VERIFIED** | Permission matrix + domain route tests |
| Maker-checker: no self-approve registration/loan/reconciliation (SA loan exempt) | Domain SoD tests + service guards | **VERIFIED** | `sod-self-approve.test.ts`, registration service |
| Admin fee before disbursement, not before approval | API: `assertAdminFeeRecorded` only on `disburseLoan`; UI previously blocked approve — **fixed on audit branch** | **PARTIALLY VERIFIED** → **VERIFIED** after fix | `loans/service.ts`, `LoanDetailPanel.tsx` |
| Guarantor cap of 3 active guarantees | `MAX_GUARANTOR_GUARANTEES = 3` in `guarantor-eligibility.ts` | **VERIFIED** | `guarantor-eligibility.test.ts` |
| Leader guarantor cap of 5 | Displayed as 5; pre-fix code always returned eligible for leaders — **fixed on audit branch** | **IMPLEMENTED BUT BROKEN** → **VERIFIED** after fix | `guarantor-eligibility.ts` |
| Interest-free loans, pool capital | Pool lock at disburse; create does not reserve capital | **PARTIALLY VERIFIED** | `disburseLoan` `findPoolByIdForUpdate`; `pool-capital-create.test.ts` |
| Demo users for training | Blocked in production by design | **VERIFIED** | Auth env guards |
| GhanaPost official digital address | Planning doc only; placeholder address in forms | **NOT IMPLEMENTED** | `GHANAPOST_GPS_INTEGRATION_PLAN.md` |

---

## Operations manual / loan workflow

| Claim | Code reality | Status | Evidence |
|-------|--------------|--------|----------|
| Public stepper: Registration → … → Admin Fee → Disburse | Matches `LOAN_WORKFLOW_STATUS.md` and `loan-workflow-steps` | **VERIFIED** | Frontend stepper utils + domain lifecycle |
| Admin fee step after loan approval | SMS on approve mentions fee; disburse requires recorded fee | **VERIFIED** | `approveLoan` notify + `assertAdminFeeRecorded` |
| Super Admin can approve without paying fee first | Was UI-blocked; API always allowed — **fixed on audit branch** | **INCONSISTENT** → **VERIFIED** after fix | Bug V181-001 |
| Group capacity from settings | `getGroupSizeLimits()` from `system_settings` | **VERIFIED** | `SETTINGS_ENFORCEMENT_AUDIT.md`, groups service |
| Community formation queue respects min/max | `processApprovedBorrower` uses settings | **VERIFIED** | group-formation service |

---

## Notifications / scheduler

| Claim | Code reality | Status | Evidence |
|-------|--------------|--------|----------|
| T-1 payment reminder SMS at 06:00 Ghana | Cron `0 6 * * *` UTC in `vercel.json`; domain scheduler + dedupe in `payment-notifications.ts` | **PARTIALLY VERIFIED** | Code + unit tests; live cron/SMS **BLOCKED** |
| Cron auth via secret, not spoofable header | Unauthenticated → 401; `x-vercel-cron` alone → 401 | **VERIFIED** | Production probe 17 Aug 2026 |
| Guarantor missed-payment SMS after >2 missed weeks | Implemented in payment scheduler | **VERIFIED** | `payment-scheduler.service.ts` |
| Guarantor missed SMS once per borrower | Pre-fix: no dedupe — **fixed on audit branch** | **IMPLEMENTED BUT BROKEN** → **VERIFIED** after fix | Bug V181-002 |
| Staff in-app on T-1 / due-today | Documented in timing doc; not wired for all staff events | **NOT IMPLEMENTED** | `event-dispatch.ts` inventory |
| Payment confirmation SMS toggle | UI label implied payment-only; setting is global SMS kill switch — **copy fixed on audit branch** | **INCONSISTENT** → **VERIFIED** after fix | `dispatchSms` checks `smsNotificationsEnabled` |
| `notifyLoanClosed`, `notifyLoanDefault`, `notifyCollectionReminder` | Functions exist; not all callers wired | **PARTIALLY VERIFIED** | Static emitter search |

---

## Location

| Claim | Code reality | Status | Evidence |
|-------|--------------|--------|----------|
| Region → district → community cascade | Implemented in location modules + registration UI | **VERIFIED** | Location routes + UI tests |
| Community formation / coverage queue | Domain formation service | **VERIFIED** | group-formation tests |
| GhanaPost GPS validation | Integration plan only | **NOT IMPLEMENTED** | `GHANAPOST_GPS_INTEGRATION_PLAN.md` |
| GPS on collections | Required in payment capture regardless of `gpsVerificationEnabled` setting | **INCONSISTENT** | Settings flag not gating collector GPS |

---

## Finance / security books

| Claim | Code reality | Status | Evidence |
|-------|--------------|--------|----------|
| Payment allocation order | `allocation.ts` domain rules + tests | **VERIFIED** | financial-integrity suites |
| Pool capital hard-stop at disburse | Row lock + available capital check | **VERIFIED** | `disburseLoan` transaction |
| CSRF on auth mutations | Route handlers issue/validate CSRF | **VERIFIED** | auth routes |
| Session HMAC | Health reports `hmac-signed-token` | **VERIFIED** | production health |
| 2FA for Super Admin only (settings copy) | `twoFactorRequired` applies to all users at login — **copy fixed on audit branch** | **INCONSISTENT** → **VERIFIED** after fix | `auth/routes.ts` |
| Session timeout from settings | Stored in DB; sessions use env TTL (~24h) | **INCONSISTENT** | settings vs session module |
| IP allowlist / failed-login lockout from settings | Stored; not fully enforced in auth path | **PARTIALLY VERIFIED** | settings audit |
| Record Centre org search for collectors | Pre-fix: `REGISTER_BORROWERS` on `/records/search` — **fixed on audit branch** | **IMPLEMENTED BUT BROKEN** → **VERIFIED** after fix | Bug V181-003 |

---

## Settings UI vs enforcement

Authoritative detail: `documentation/settings/SETTINGS_ENFORCEMENT_AUDIT.md` (v1.8.1 hotfix). Summary:

| Enforced in domain | Display-only / env-hardcoded |
|--------------------|------------------------------|
| Admin fee, max loan, group min/max, grace days, reminder lead time | Branding colours, session timeout minutes |
| SMS/email master flags, per-event SMS toggles where wired | SMS provider/sender (env) |
| `twoFactorRequired` at login (all roles) | IP allowlist, password policy UI vs min length 10 |
| Late payment + scheduler timing | `gpsVerificationEnabled`, reconciliation variance % mismatch |
| | `allowLoanRollovers`, default duration weeks (UI default 12) |

---

## Super Admin mobile navigation (v1.8.1 maintenance)

| Claim | Status | Evidence |
|-------|--------|----------|
| Full nav via scrollable drawer on mobile | **PARTIALLY VERIFIED** | Code + jsdom tests in PR #209 |
| Live operator confirmation | **BLOCKED** | Audit policy — no production login |

---

## Conclusion

Documentation is **substantially accurate** on lifecycle and financial core paths. Primary gaps are: (1) settings labels vs enforcement, (2) GhanaPost not built, (3) notification matrix entries for unwired staff alerts, (4) live production proof deliberately **BLOCKED**. This audit branch fixes proven doc/code mismatches that were production-impacting (loan approve gate, records RBAC, guarantor dedupe, leader cap, settings copy).
