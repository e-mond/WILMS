# RC1 ÔÇö Notifications

**Gate:** GATE 4  
**Date:** 2026-06-30

---

## Endpoints

| Action | Route | Status |
|--------|-------|--------|
| List inbox | `GET /notifications/inbox` | Live |
| Unread count | `GET /notifications/inbox/unread-count` | Live |
| Mark read | `PATCH /notifications/inbox/:id/read` | Live |
| Mark all read | `POST /notifications/inbox/mark-all-read` | Live |

---

## RC1 changes

- Removed silent `catch ÔåÆ 0` fallback in `useNotificationUnreadCount`
- Errors now propagate to UI error states per golden rule

---

## Polling

`staleTime: 30_000` on inbox and unread count queries.

---

**Verdict:** Notifications use live API; fallbacks removed.
