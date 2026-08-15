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

## Remaining deferred items

- Official GhanaPost GPS API (planning: `documentation/location/GHANAPOST_GPS_INTEGRATION_PLAN.md`)
- Collector expense-submitted count stub
- Operator-run authenticated SMS and assignment smoke on production
- No schema migration in this release

## Production confidence

**90 / 100** for engineering and unauthenticated production identity. Withhold **WILMS v1.8.1 Production Certified** until the programme owner completes the authenticated SMS / capacity smoke checklist above.

Recommendation: declare **engineering-complete and production-deployed**. Certification after operator smoke.
