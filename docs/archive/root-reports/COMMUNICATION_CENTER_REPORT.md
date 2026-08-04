# Communication Center Report — v1.2.3

## SMS Invitation Flow

```
createUser()
  → notifyUserInvitation()
    → dispatchMail (USER_INVITED)
    → dispatchSms (USER_INVITED) when phone provided
      → normalizeGhanaPhone()
      → provider.send() with retries (max 2)
      → logMessageDelivery()
```

## Delivery Logging

All invitation SMS attempts are written to `message_deliveries` with success/failure, provider name, retry count, and `failureReason`.

## Failed Message UI

`formatDeliveryFailure()` converts raw provider errors and JSON payloads into:

- Summary (e.g. "SMTP authentication failed")
- Details (plain-language explanation)
- Technical details (expandable raw value)

Applied in Communication Center **Failed Messages** tab.

## Scheduler & Templates

Existing v1.2.0–v1.2.1 communication platform capabilities remain available:

- Scheduled and recurring campaigns
- Template builder with versioning
- Campaign analytics dashboard
- Edit, reschedule, cancel via communications service

No regressions introduced in compose/outbox flows.
