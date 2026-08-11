# Notification Propagation Report

**Product:** WILMS v1.8.0

## Verification matrix (Phase 11)

| Workflow event | SMS | Email | In-app | Push* | Audit / delivery log |
|----------------|-----|-------|--------|-------|----------------------|
| Registration submitted | ✓ | ✓ | Officer | Pref | Delivery log |
| Registration approved | ✓ | ✓ | — | Pref | Delivery log |
| Group assigned | ✓ | — | Collector/actor | Pref | `group.member_added` |
| Collector reassigned | — | Existing helper | Old/new | Pref | `group.collector_reassigned` |
| Payment day changed | ✓ (on approve) | ✓ | — | Pref | Schedule change audit |
| Admin fee / payment | Existing | Existing | Existing | Pref | Existing |
| Loan approved / disbursed | Existing | Existing | Existing | Pref | Existing |
| Schedule generated | ✓ distinct event | — | — | Pref | Delivery log |
| Reminders / missed / grace / escalate | Existing ladder | Existing | Existing | Pref / critical | Existing |

\*Push mirrors in-app when preferences and quiet hours allow; critical severity can bypass quiet hours.

## Duplicate prevention

Schedule SMS after disbursement uses event `SCHEDULE_GENERATED` instead of a second `LOAN_DISBURSED` payload, so delivery logs remain distinct and preference/dedupe logic can treat them separately.
