# WILMS v1.8.1 — Production Maintenance Report

**Release identity:** v1.8.1  
**Release type:** Production-safe maintenance  
**Date:** 15 August 2026  
**GhanaPost GPS:** not included  

## Merge details

| Field | Value |
|-------|-------|
| PR | https://github.com/e-mond/WILMS/pull/206 |
| Merge commit | `08d9c6d2981156dd4a136c408d856d1a8be3a82d` |
| Feature branch | `hotfix/v1.8.0-settings-notifications-borrower-records` |
| Tag | `v1.8.1` |
| GitHub Release | https://github.com/e-mond/WILMS/releases/tag/v1.8.1 |

## Deployment details

| Field | Value |
|-------|-------|
| Production URL | https://wilms.vercel.app |
| GitHub deployment ID | `5921969327` |
| Vercel log URL | https://wilms-cmb05uqn9-emonds-projects.vercel.app |
| Production SHA | `08d9c6d2981156dd4a136c408d856d1a8be3a82d` |
| Health version | `1.8.1` |
| Health status | `ok` |
| Database | configured, connected |
| Mail | Gmail configured |
| SMS | smsnotifygh configured |
| Scheduler | HTTP-triggered |
| Push | optional |
| Login label | `WILMS v1.8.1` |

## CI results (PR #206)

| Check | Result |
|-------|--------|
| validate | pass (6m58s after blacklist route fix) |
| security | pass |
| GitGuardian | pass |
| Vercel preview | pass |

First validate run failed on static API integrity (`PATCH /borrowers/:id/blacklist` missing). Route was added in `da1950d` and checks went green.

## Local gates

| Gate | Result |
|------|--------|
| type-check | pass |
| lint | pass |
| frontend tests | pass |
| domain tests | pass (two 15s timeouts under load retried in isolation and passed) |
| build | pass |

## Smoke-test evidence

### Unauthenticated production

| Check | Result |
|-------|--------|
| `GET /api/wilms/health` | `ok`, version `1.8.1`, SHA `08d9c6d…` |
| Login page | 200, label `WILMS v1.8.1` |
| `/records` | 307 to auth (expected) |
| Demo login without CSRF | rejected (expected) |

### Authenticated workflow smoke (operator required)

Implemented and covered by unit tests. Live SMS / assignment / records UI on production requires programme-operator credentials. Demo users are blocked in production.

| Workflow | Engineering evidence | Live operator smoke |
|----------|----------------------|---------------------|
| Settings enforcement / group capacity | Domain `getGroupSizeLimits`; approver UI disables full groups | Pending operator |
| Community Formation Queue | Formation service uses stored min/max | Pending operator |
| Registration / Approver location hierarchy | Review panels show cascade | Pending operator |
| Notification timing | `notifyBorrower` only when approved | Pending operator |
| Rejection / blacklist / escalate SMS | Event dispatch + PATCH blacklist route | Pending operator |
| Borrower Record Centre | `/records` routes + domain search | Pending operator |
| Guarantor SMS | Loan approve / close / missed >2 | Pending operator |
| Loan workflow stepper | Public step sequence tests | Pending operator |
| Exports | Existing branded filename tests | Pending operator |

## Issues fixed

- Settings enforcement (group min/max, max loan)
- Group capacity validation
- Community Formation Queue
- Location hierarchy on registration and approver review
- Borrower Record Centre
- Collector profile live data
- Readable identifiers
- Loan workflow stepper
- Notification timing (no SMS on pending group assignment)
- Borrower rejection / blacklist / escalation notifications
- Guarantor notifications
- Export improvements retained
- GPS placeholder reverse geocode **without** GhanaPost
- Missing `PATCH /borrowers/:id/blacklist` route (CI + production parity)

## Follow-up maintenance (T-1 SMS + Super Admin mobile navigation)

**Branch:** `fix/v1.8.1-t1-payment-reminder`  
**Product version:** remains **1.8.1** (no bump)

### T-1 borrower payment reminder

**Root cause:** T-1 matching used strict string equality on `dueDate`, so timestamp-shaped values such as `2026-08-18T00:00:00.000Z` never matched tomorrow’s calendar date. Invalid lead-time `0` was treated as “due today”. Failed SMS deliveries could not be retried because the unique delivery row remained. Super Admin mobile navigation dumped the full authorised list into a compact bottom pill bar with the drawer disabled, so items were clipped/unreachable.

Production env names: `CRON_SECRET` is present; `WILMS_SCHEDULER_TOKEN` is not. Unauthenticated cron requests return 401. Vercel Cron execution logs were not available in this session and must be confirmed after deploy.

**Fix:** Configure Production `CRON_SECRET` (Vercel-supported bearer). Keep `WILMS_SCHEDULER_TOKEN` for manual runs. Normalise due dates to Africa/Accra calendar dates. Match T-1 against the next PENDING week only. Retry `FAILED` SMS deliveries; keep successful sends idempotent.

**Security:** `x-vercel-cron` is not accepted as authentication (spoofable). Secrets are not logged or committed.

### Super Admin mobile navigation

**Root cause:** Super Admin used operational bottom-pill navigation with the full `SUPER_ADMIN_NAV` list and `enableMobileNavDrawer={false}`. On narrow viewports the pills overflowed/clipped, so authorised destinations were unreachable. This was a layout completeness bug, not RBAC.

**Fix:** Super Admin keeps the operational header and gains the existing scrollable mobile drawer (hamburger + `AppSidebar`), sourced from the same filtered `SUPER_ADMIN_NAV`. Other roles keep their shorter bottom navigation. Permissions are unchanged.

Details: `documentation/notifications/SCHEDULER_NOTIFICATION_TIMING.md`.

## Remaining deferred items

- Official GhanaPost GPS API (planning: `documentation/location/GHANAPOST_GPS_INTEGRATION_PLAN.md`)
- Collector expense-submitted count stub
- Operator-run authenticated SMS and assignment smoke on production
- No schema migration in this release

## Production confidence

**90 / 100** for engineering and unauthenticated production identity. Withhold **WILMS v1.8.1 Production Certified** until the programme owner completes the authenticated SMS / capacity smoke checklist above.

Recommendation: declare **engineering-complete and production-deployed**. Certification after operator smoke.
