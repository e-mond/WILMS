# WILMS v1.1.3 — Notification Center Report

**Version:** `1.1.3`

## In-app notification center

### Navbar inbox (existing, enhanced)
- Location: `NotificationInboxPanel.tsx`
- Filters: All / Unread / Critical
- Mark read (single + mark all)
- Deep links via `href`
- Severity badges (INFO / WARNING / CRITICAL)

### New API endpoints
- `POST /notifications/mark-all-read` — bulk mark read
- `DELETE /notifications/:id` — archive (soft delete)

### Domain event → inbox bridge

`in-app-notify.ts` creates inbox entries for staff when:
- Loan approved/disbursed/completed (collector notified)
- Payment received (collector notified)
- Loan default (collector notified)
- User invited/activated/disabled/role changed (user notified)
- Group created, collector assigned
- Communication broadcasts

### Notification enum extensions

Added to `notification_event`: USER_INVITED, LOAN_APPROVED, LOAN_REJECTED, BORROWER_BLACKLISTED, PAYMENT_REVERSAL, USER_ACTIVATED, USER_DISABLED, ROLE_CHANGED, GROUP_CREATED, COLLECTOR_ASSIGNED, COMMUNICATION

Added to `notification_channel`: IN_APP

## Communication Center UI

Super-admin module at `/communication-center` with:
- Compose tab with multi-channel selector
- Outbox with status filtering
- Templates library
- Delivery reports with analytics KPIs
- Failed messages table

## RBAC

Bell visible to users with report/portal permissions. Communication Center requires `MANAGE_COMMUNICATIONS` or `VIEW_COMMUNICATION_ANALYTICS`.
