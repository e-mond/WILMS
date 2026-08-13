# Group Collection GPS

**Version:** v1.8.0  
**Classification:** Confidential

---

## Capture

When a collector records a group collection sheet, GPS is captured **once per batch** and stored on each payment:

| Field | Source |
|-------|--------|
| Latitude / longitude | Device geolocation |
| Accuracy | `coords.accuracy` (metres) |
| Timestamp | Capture time (ISO) |
| Collector ID | Session user |
| Device metadata | User agent, platform, language when available |

Storage: `payments.gps` JSONB.

## Exception path

If GPS is unavailable:

1. The collector must confirm the exception.
2. A reason is required.
3. The payment is stored with `unavailable: true` and the reason.
4. Audit action `collection.gps-exception` is written.

## Display

| Surface | Presentation |
|---------|--------------|
| Payment / loan log | Coordinates or “Unavailable — reason” |
| Exports | GPS column uses the same summary |
| Audit trail | `collection.gps-exception` plus payment recorded |

Individual payment entry still captures GPS; group collections now share the same payload shape and exception confirmation.
