# Notification UX Review

**Version:** 1.4.2 | **Phase:** 30

## Inbox (existing, preserved)

- Unread badge, filters, pagination, mark read / mark all read
- Loading via React Query; 30s stale time
- `NotificationSoundBridge` uses sessionStorage dedupe for toasts

## Toast policy

| Use toast | Use inbox |
|-----------|-----------|
| Immediate user action feedback | Payment reminders |
| Form save success | Missed payments |
| | Payment confirmations (collector) |
| | Admin operational summaries |

Phase 29 duplicate-toast fixes preserved (`notification-toast-tracker.ts`, `uiStore` dedupeKey).

## Deep links

| Role | Missed payment href |
|------|---------------------|
| Collector | `/collector/payment/{borrowerId}` |
| Super Admin | `/reports/defaulters` (summary) |

## Accessibility

Existing drawer keyboard navigation preserved. No new modal-only flows added.

## Frontend gaps (accepted)

`types/notification.ts` enum subset — inbox displays backend event strings dynamically. Full enum sync deferred.
