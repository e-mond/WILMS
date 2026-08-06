# Notification Center Report (v1.6.1)

## Unified inbox

- Wider drawer (`~26rem`) titled **Notification inbox**.
- Sticky filter chips with categories: All, Unread, Critical, Payments, Loans, Recon, Messages, Reminders, System, Security.
- Search, pagination, mark-all-read, and per-item mark-read / delete / deep-link retained.
- **Clear read** removes read items via existing delete mutation (client-side bulk).

## Cards

Each item continues to show severity badge, title, body, relative timestamp, optional actor avatar, and actions.

## Non-goals

Event generation, severity assignment, quiet hours, and scheduler behavior are unchanged from v1.6.0.
