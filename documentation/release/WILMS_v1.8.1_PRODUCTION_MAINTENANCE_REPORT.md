# WILMS v1.8.1 — Production Maintenance Report

**Release identity:** v1.8.1  
**Branch:** `hotfix/v1.8.0-settings-notifications-borrower-records`  
**Release type:** Production-safe maintenance  
**GhanaPost GPS:** not included  

This file is completed after merge and production deploy (merge SHA, deployment ID, smoke evidence). Until then it records the intended release scope.

## Scope

- Settings enforcement and group capacity
- Community Formation Queue
- Registration and Approver location hierarchy
- Borrower Record Centre
- Collector profile
- Readable identifiers
- Loan workflow stepper
- Notification timing
- Borrower rejection / blacklist / escalation notifications
- Guarantor notifications
- Export improvements
- GPS placeholder groundwork without GhanaPost

## Merge details

| Field | Value |
|-------|-------|
| PR | _pending_ |
| Merge commit | _pending_ |
| Tag | `v1.8.1` |

## Deployment details

| Field | Value |
|-------|-------|
| Production URL | https://wilms.vercel.app |
| Deployment ID | _pending_ |
| Production SHA | _pending_ |
| Health version | expected `1.8.1` |

## Smoke-test evidence

Authenticated production SMS, group assignment, and records smoke require operator credentials. Unauthenticated health and version checks are recorded after deploy.

## Issues fixed

See `CHANGELOG.md` `[1.8.1]` and `documentation/hotfix/FINAL_HOTFIX_REPORT.md`.

## Remaining deferred items

- Official GhanaPost GPS API (planning document after certification)
- Collector expense-submitted count stub
- Operator-run authenticated SMS smoke on production

## Production confidence

Engineering gates (type-check, lint, tests, build) plus CI on the release PR. Final certification recommendation is issued after production health confirms `1.8.1` and the merge SHA.
