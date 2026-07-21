# Notification Manual Actions Required

**Version:** 1.4.2 | **Phase:** 30

## External evidence gates

| # | Gate | Owner | Command / action |
|---|------|-------|------------------|
| 1 | Production cron for scheduler | Operations | Configure daily POST to `/notifications/scheduler/run` |
| 2 | Live SMS delivery test | Operations | Send test missed-payment SMS on staging with real provider |
| 3 | Live email delivery test | Operations | Send test payment confirmation email on staging |
| 4 | Provider webhook delivery status | Operations | If provider supports DLR, verify `delivered_at` population |
| 5 | Load test scheduler at scale | SRE | Run scheduler with 10k+ active loans on staging |

## Credentials required

See [docs/operations/ENVIRONMENT_VARIABLES.md](../../../operations/ENVIRONMENT_VARIABLES.md) — mail and SMS provider variables.

## Phase 29 certification

Phase 29 operator gates remain independent. This phase adds notification-specific operator gates above.

Do **not** claim Production Certified until Phase 29 gates complete.
