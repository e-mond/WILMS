# Notification RBAC Report

**Version:** 1.4.2 | **Phase:** 30

| Actor | Visibility |
|-------|------------|
| Session user | Own inbox only (`user_id = session.userId`) |
| Collector | Missed/confirmed in-app for assigned group borrowers only |
| Super Admin | Daily missed summary; full ops permissions for scheduler |
| Borrower | SMS/email only (no borrower user accounts / inbox) |

## Negative cases

- Mark-read / archive require matching `user_id`
- Scheduler requires `manage-communication-scheduler`
- Manual send requires `manage-communications` or `manage-users`

## Cross-collector leak

Prevented by resolving collector from `groups.collector_user_id` for the borrower's group only.
