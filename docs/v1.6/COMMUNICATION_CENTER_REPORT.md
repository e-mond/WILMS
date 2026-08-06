# Communication Center Report (v1.6)

## Summary

Communication Center now treats borrowers, groups, and group leaders as first-class audiences alongside staff roles. Compose supports preview, saved segments, multi-select chips, and channel-aware delivery (email / SMS / in-app / push).

## Audience types

| Type | Recipients |
|------|------------|
| `ALL_USERS` | Active staff users |
| `ALL_COLLECTORS` / `ALL_OFFICERS` / `ALL_APPROVERS` / `ALL_AUDITORS` / `ALL_ADMINS` | Active users by role |
| `ALL_BORROWERS` | Active borrowers (excludes rejected/blacklisted) |
| `SPECIFIC_BORROWERS` | `audienceFilter.borrowerIds[]` |
| `SPECIFIC_GROUP` | Active members of one group (`groupId`, optional `leaderOnly`) |
| `SPECIFIC_GROUPS` | Members of multiple groups (`groupIds[]`, optional `leaderOnly`) |
| `ALL_GROUP_LEADERS` | Distinct `groups.leader_borrower_id` |
| `CUSTOM` | Union of roles + borrowerIds + groupIds |
| `SPECIFIC_USER` | Single staff user |

## Delivery rules

- SMS uses **phone** (never email).
- EMAIL skipped when no address.
- IN_APP / PUSH only when a `userId` exists (borrowers are SMS/email oriented).
- Staff preference gating via `shouldSendChannel`; quiet hours defer non-critical announcements/reminders.

## APIs

- `POST /communications/audience/preview`
- `GET/POST/PATCH/DELETE /communications/audience-segments`
- `POST /communications/messages/:id/read` (read receipts)

## Migration

`0033_communication_audience_segments` — segments table, message reads, quiet-hours preference columns.
