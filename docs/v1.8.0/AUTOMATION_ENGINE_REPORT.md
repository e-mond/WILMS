# WILMS v1.8.0 — Automation Engine Report

## Delivered

- Migration `0038_v180_automation_engine` (`automation_rules`, `automation_runs`, `automation_tasks`)
- Default rules: payment reminders, overdue escalation, collector follow-ups, executive report schedule
- Reminder offsets: -3/-1/0/+1/+3/+7/+14/+30 days
- Escalation thresholds: 7/14/30/60/90 days
- `POST /automation/scheduler/run` (token cron) + authenticated `/automation/*` APIs
- Follow-up task creation with in-app + push notify
- Settings → Automation admin surface (list rules, open tasks, run daily pass)

## Integration

Daily pass records heartbeat and seeds rules; existing payment notification scheduler continues to deliver channel fan-out. Visual workflow rule builder remains a follow-up.
