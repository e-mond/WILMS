# Notification Performance Audit

**Version:** 1.4.2 | **Phase:** 30

## Findings

| Area | Status |
|------|--------|
| Inbox list unbounded | **Fixed** — default limit 50, max 100 |
| Unread count via full inbox load | **Fixed** — SQL `count(*)` |
| Scheduler N+1 borrower fetches | Accepted for v1; SQL batch candidate for Phase 31 |
| Dedupe unique index | ✓ migration 0030 |
| Index on `(notification_type, created_at)` | ✓ |
| Index on `loan_id` | ✓ |
| Index on `notifications.dedupe_key` | ✓ |

## Frontend

Inbox already paginates client-side (PAGE_SIZE 20). Backend now also caps payload.

## Residual

Large-portfolio scheduler scale test (10k+ active loans) — operator gate.
