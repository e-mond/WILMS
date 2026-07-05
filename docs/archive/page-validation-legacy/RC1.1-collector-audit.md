# RC1.1 ÔÇö Collector Module Audit

**Date:** 2026-07-01

## Routes & APIs

| Page | API | Post-hotfix status |
|------|-----|-------------------|
| Dashboard | `GET /collector/:id/dashboard` | 200 (self-access) |
| My Borrowers | `GET /collector/:id/borrowers` | 200 |
| Payment entry | `POST /payments` | Live + offline queue |
| Reconciliation | `GET /reconciliation` | 200 |
| Admin fee | `GET /admin-fee/status` | No approver-only eligibility call |
| Notifications | `GET /notifications/inbox/unread-count` | 200 |

## Offline / GPS / photos

- Offline payments: `offlineQueueStore` + background sync tag
- GPS: captured on payment submission
- Photos: `uploadService` ÔåÆ `POST /uploads` (CSRF + `CAPTURE_DOCUMENTS`)

## RBAC

`assertCollectorAccess()` ÔÇö collector may only access own `collectorId`; admin override.

## Verdict

**PASS** ÔÇö Collector portal live; smoke + integration tests green.
