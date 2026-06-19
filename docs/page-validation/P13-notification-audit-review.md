# P13 Notification & Audit Pipeline Review

Audit date: 2026-06-09.

---

## Architecture overview

```
UI / hooks / mock sync modules
        │
        ▼
  notificationService / auditService  (via @/services barrel → IDataProvider)
        │
   ┌────┴────┐
   Mock      API stub
   (demo)    (production target)
```

Provider wiring: `MockDataProvider.ts` L45–48, `ApiDataProvider.ts` L45–48.

---

## Notification service

### Interface

`INotificationService` in `src/types/services.ts` L353–359:

- `listInbox()` → `NotificationInboxItem[]`
- `getUnreadCount()` → `number`
- `markAsRead(notificationId)`
- `sendNotification(input)` → `NotificationDelivery`
- `sendSupervisorAlert(input)` → `void`

### API provider

`src/services/notificationService.ts` — maps to:

| Method | Endpoint |
|--------|----------|
| listInbox | `GET /notifications/inbox` |
| getUnreadCount | `GET /notifications/inbox/unread-count` |
| markAsRead | `PATCH /notifications/:id/read` |
| sendNotification | `POST /notifications` |
| sendSupervisorAlert | `POST /notifications/supervisor-alert` |

### Mock provider (demo mode)

`src/services/mock/notificationService.mock.ts`:

- In-memory inbox with seed items (includes P13 `subjectName` / `subjectId` for avatars)
- Tracks read state in `readNotificationIds` Set
- Stores deliveries and supervisor alerts in memory arrays
- `sendSupervisorAlert` also triggers inbox notification via internal `sendNotification`

### UI wiring

| Consumer | Behavior |
|----------|----------|
| `NotificationInboxPanel.tsx` | React Query → `notificationService.listInbox`, `markAsRead` |
| Navbar unread badge | `getUnreadCount` hook |
| Tests | `src/tests/services/nf-02-notifications.test.ts` (4 tests passing) |

### Event producers (mock sync modules)

Modules that call `notificationServiceMock.sendNotification` or `sendSupervisorAlert`:

| Module | Trigger |
|--------|---------|
| `borrowerService.mock.ts` | Registration approved/rejected |
| `payment-reminder.sync.ts` | Payment reminders |
| `loan-notifications.sync.ts` | Loan lifecycle events |
| `overpaymentReviewService.mock.ts` | Overpayment queued/resolved + supervisor alert |
| `borrower-escalation.sync.ts` | Defaulter escalation |

**Demo mode:** All above run in-process; notifications appear in inbox without external service.

**Backend required:** Persistent inbox, delivery tracking, push/email channels (UI only implements in-app inbox).

---

## Audit service

### Interface

`IAuditService` in `src/types/services.ts` L386–389:

- `createEntry(input: CreateAuditEntryInput)` → `AuditEntry`
- `listRecentEntries(params?: AuditListParams)` → `AuditEntry[]`

DTO: `CreateAuditEntryInput` in `src/types/audit.ts` — `action`, `actorId`, `targetEntityId`, `targetEntityType`, optional `reason`.

### API provider

`src/services/auditService.ts`:

| Method | Endpoint |
|--------|----------|
| createEntry | `POST /audit` |
| listRecentEntries | `GET /audit-log?limit&action&actorId&fromDate&toDate` |

### Mock provider (demo mode)

`src/services/mock/auditService.mock.ts` — delegates to `audit-log.store.ts` (in-memory append + filter).

Tests: `src/tests/services/auditService.mock.test.ts` (2 tests passing).

### Audit event producers

| Source | Evidence |
|--------|----------|
| `groupService.mock.ts` | 8× `auditServiceMock.createEntry` on membership/flag/reassign actions |
| `useApprovalActions.ts` | `auditService.createEntry` on approve/reject/blacklist |
| `useRiskFlagActions.ts` | `auditService.createEntry` on resolve/dismiss |
| `overpaymentReviewService.mock.ts` | Audit on queue/resolve |

### UI consumers

| Surface | Service call |
|---------|--------------|
| Audit log report | `auditService.listRecentEntries` — `AuditLogReportPanel.tsx` |
| Settings activity | `settingsService.getSettingsActivity` (separate from audit service) |
| Group profile "View Audit History" | Link to `/reports/audit-log?entity=` |

---

## What works in demo mode

| Capability | Status | Evidence |
|------------|--------|----------|
| Inbox list + unread count | Working | Mock seed + read tracking |
| Mark as read | Working | `markAsRead` mutates Set |
| Send notification (internal) | Working | Mock sync modules |
| Supervisor alerts | Working | Stored + triggers inbox item |
| Create audit entries | Working | Mock store append |
| List audit log | Working | Filter/sort in mock |
| Audit on group/approval/risk actions | Working | grep `createEntry` callers |
| Avatar in inbox (P13) | Working | `subjectName` on seed items |

---

## What requires backend

| Capability | Frontend state | Backend need |
|------------|----------------|--------------|
| Persistent inbox | Mock in-memory | Database + user-scoped queries |
| Real-time notifications | Poll on mount | WebSocket or SSE optional |
| Email/SMS delivery | Not implemented | `SendNotificationInput` channel fields |
| Audit immutability | Mock array | Append-only audit store, tamper evidence |
| Cross-service audit | UI calls `createEntry` | Backend should also audit server-side mutations |
| Notification on payment edit | `PaymentEditSection` success message mentions supervisor | Backend must implement `sendSupervisorAlert` on PATCH payment |
| Audit log pagination | `limit` param only | Cursor pagination for large logs |

---

## Missing backend dependencies (verified gaps)

1. **No running API server** — `ApiDataProvider` endpoints are TypeScript stubs only.
2. **`deleteRegistration`** — mock only; API borrower service rejects (`borrowerService.ts` L83–86).
3. **Upload URLs on entities** — notifications/audit avatars use Dicebear; backend should attach `photoUrl` to user/borrower DTOs.
4. **Settings activity vs audit log** — two separate data sources; backend should clarify relationship.

---

## Test coverage

| Area | Tests |
|------|-------|
| Notifications | `nf-02-notifications.test.ts` — 4 passed |
| Audit mock | `auditService.mock.test.ts` — 2 passed |
| Audit log panel | `AuditLogReportPanel.test.tsx` |

---

## Summary

Demo mode provides a **complete in-process notification and audit pipeline** for workflow testing. Production requires implementing the 7 notification and 2 audit API endpoints with persistent storage and server-side event emission on all mutating operations currently handled only in mock services.
