# WILMS Notification & Communication Book

**Version:** 1.7.3  
**Classification:** Confidential

---

## 1. Overview

WILMS delivers multi-channel notifications and a Communications Center for programme-wide messaging.

---

## 2. Notification channels

| Channel | Use cases |
|---------|-----------|
| In-app | All event types; notification inbox |
| Email | Login alerts, invitations, expense reviews |
| SMS | Borrower lifecycle (registration through completion), payment reminders, field alerts |

---

## 3. Notification guarantees

---

## 3. Notification guarantees

### Deduplication

Same event within deduplication window produces single notification. Prevents alert fatigue from retry or duplicate dispatch.

### Quiet hours

Organisation-configured quiet hours suppress non-critical notifications. Critical security alerts (login from new device) may override.

### Cron dispatch

Daily batch dispatch at 06:00 UTC via Vercel Cron (`/api/cron/notifications`). Failed dispatches logged; retry on next cycle.

---

## 4. Event types

| Event | Channels | Recipients |
|-------|----------|------------|
| Registration submitted / approved | SMS, email (optional/yes), in-app | Borrower (SMS), officer/collector |
| Loan created / approved | SMS, email, in-app | Borrower (SMS), collector |
| Admin fee / disbursement / schedule | SMS, email, in-app | Borrower (SMS), collector |
| Payment reminder / due today | SMS; email optional or none | Borrower |
| Missed / grace / escalation | SMS; email per matrix | Borrower, collector, Super Admin |
| Payment received / loan completed | SMS, email, in-app | Borrower (SMS), collector |
| Login alert | Email | User |
| Invitation accepted | In-app | Admin |
| Expense submitted | In-app, Email | Reviewers |
| Expense approved/rejected | In-app, Email | Submitter |
| Reconciliation variance | In-app | Admin, Approver |
| Overpayment review | In-app | Approver |
| Ops incident | In-app | Admin |
| Maintenance window | In-app | All users |

Borrower SMS copy and timing: `documentation/notifications/`.


---

## 5. In-app notification inbox

Accessible from navbar bell icon. Shows unread count. Mark individual or all as read. Role-aware filtering — users see only relevant notifications.

---

## 6. Communications Center

### Templates

Reusable message templates with variable substitution (e.g., `{borrowerName}`, `{amount}`). Admin creates and manages templates.

### Broadcasts

Targeted messages to role groups or all users. One-way communication from HQ to field.

### Message threads

Two-way messaging between HQ staff and field collectors. Threaded conversation view.

### Audit

All sent messages logged with sender, recipients, timestamp, and content hash.

---

## 7. Configuration

Super Admin → Settings:
- Notification preferences per channel
- Quiet hours schedule
- Email/SMS provider credentials (environment variables)

---

## 8. API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | List user notifications |
| PATCH | `/notifications/:id/read` | Mark read |
| POST | `/communications/broadcasts` | Send broadcast |
| GET | `/messages` | Message threads |

---

## 9. Planned enhancements (v1.9+)

- Scheduled report delivery via notification
- Advanced routing rules
- Borrower SMS reminders (v2.5)
- Push notifications via PWA service worker

---

*CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official record keeping only.*
