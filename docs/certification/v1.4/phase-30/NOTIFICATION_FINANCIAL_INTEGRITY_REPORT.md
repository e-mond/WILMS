# Notification Financial Integrity Report

**Version:** 1.4.2 | **Phase:** 30

## Guarantees

| Rule | Status |
|------|--------|
| Notifications never mutate money | ✓ |
| Payment confirmation only after commit | ✓ |
| Failed notification does not roll back payment | ✓ |
| Due dates from `loan_schedules` | ✓ |
| Holiday shifts applied at schedule generation | ✓ |
| Missed marking via `applyMissedWeekMarking` + grace days | ✓ |
| Fully paid loans skipped by scheduler | ✓ |

## Authoritative sources

Outstanding balance, collections, and schedules remain SQL-authoritative from Phase 28/29. Notification amounts are display copies of already-committed values.

## Duplicate payment requests

Payment API idempotency (`runWithIdempotency`) + notification dedupe `payment-confirmed:{paymentId}` prevent duplicate confirmations.

See also: [NOTIFICATION_FINANCIAL_INTEGRATION.md](NOTIFICATION_FINANCIAL_INTEGRATION.md)
