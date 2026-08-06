# Notification Automation Report (v1.6)

## Borrower automations

| Event | Emitter / trigger | Channels |
|-------|-------------------|----------|
| Payment due tomorrow | Scheduler → `emitPaymentDueSoonNotification` | SMS, email |
| Payment due today | Scheduler → `emitPaymentDueTodayNotification` | SMS, email |
| Missed payment | Scheduler + payment mark → `emitPaymentMissedNotification` | SMS, email, collector in-app |
| Payment received | Payment confirm path | SMS, email |
| Admin fee received | Admin fee confirm path | SMS, email |
| Loan approved / disbursed | `event-dispatch` | SMS, email, in-app |
| Schedule changed | `emitScheduleChangedNotification` | SMS, email |

## Collector automations

| Event | Trigger |
|-------|---------|
| Group assignment | `notifyCollectorAssigned` |
| Missed borrower alerts | Missed payment path |
| Reconciliation reminders | Ops scheduler when no recon submitted for date |
| Reconciliation review results | Review path (in-app / push / email) |
| High variance (to Super Admin) | Reconciliation submit when flagged |

## Super Admin automations

| Event | Trigger |
|-------|---------|
| High variance reconciliation | Submit with `varianceFlagged` |
| Missed payment summary | Scheduler daily digest |
| Failed delivery digest | Ops scheduler from `message_deliveries` |
| Scheduler failures | Payment/ops scheduler catch paths |

## Guarantees

- Deduplication via `notification_delivery_records`
- Financial calculations unchanged
- Quiet hours apply to non-critical announcement/reminder categories only
