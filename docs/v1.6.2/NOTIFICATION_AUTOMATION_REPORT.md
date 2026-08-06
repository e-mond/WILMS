# Notification Automation Report (v1.6.2)

## Extended borrower ladder

Scheduler now emits overdue ladder notifications at **1 / 3 / 7** days past due (`emitPaymentOverdueLadderNotification`), in addition to:

- due soon
- due today
- newly missed

## Schedule / relocation signals

- Schedule-change approval emits `emitScheduleChangedNotification`
- Relocation notifies affected collectors via existing collector-assigned dispatch

## Ops alerts (retained from v1.6)

Recon reminders, failed delivery digests, scheduler failure alerts, high variance emitter.
