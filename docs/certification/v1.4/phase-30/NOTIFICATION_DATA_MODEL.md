# Notification Data Model

**Version:** 1.4.2 | **Phase:** 30

## Tables

| Table | Purpose |
|-------|---------|
| `notifications` | Per-user in-app inbox rows |
| `notification_delivery_records` | Idempotent multi-channel delivery gate |
| `message_deliveries` | Email/SMS provider delivery audit |
| `user_notification_preferences` | Channel/category preferences |

## `notifications` columns (Phase 30 additions)

- `dedupe_key` (nullable text)
- `correlation_id` (nullable text)

Existing: `id`, `user_id`, `title`, `body`, `event`, `channel`, `severity`, `href`, `borrower_id`, `loan_id`, `is_read`, `sent_at`, `created_at`, `deleted_at`

## `notification_delivery_records`

Unique: `(dedupe_key, recipient, channel)`

Statuses: `PENDING` | `SENT` | `DELIVERED` | `FAILED`

## Migration

`0030_v142_notification_dedupe.sql` — journal index 30.
