# Borrower SMS Policy

**Version:** v1.8.0  
**Classification:** Confidential

---

## Policy

SMS is the **mandatory** borrower channel. Every borrower communication must send SMS unless system-wide SMS is disabled for an outage (`smsNotificationsEnabled = false`).

Email is optional when an address is on file. Staff receive in-app (and push/email where already configured).

Delivery is logged with retries. Failures are recorded; they must not roll back the financial event.

## Notification matrix

| Event | SMS | Email | In-app (staff) |
|-------|:---:|:-----:|:--------------:|
| Registration submitted | Yes | Optional | Yes |
| Registration approved | Yes | Optional | Yes |
| Group assignment / reassignment | Yes | Optional | Yes |
| Collector assignment / reassignment | Yes | Optional | Yes |
| Loan created | Yes | Optional | Yes |
| Loan approved / admin fee due | Yes | Optional | Yes |
| Admin fee received | Yes | Optional | Yes |
| Loan disbursed / schedule issued | Yes | Optional | Yes |
| Payment reminder / due today | Yes | Optional | Yes |
| Payment received / multi-week | Yes | Optional | Yes |
| Missed payment / grace / escalation | Yes | Optional | Yes |
| Payment day changed | Yes | Optional | Yes |
| Borrower update approved / rejected | Yes | Optional | Yes |
| Loan completed | Yes | Optional | Yes |

## Implementation

Dispatch: `packages/domain/src/infrastructure/notifications/event-dispatch.ts` and payment / admin-fee / ops modules.  
Failure logging: message delivery log with retry.
