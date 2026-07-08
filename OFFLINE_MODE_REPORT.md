# Offline Mode Report — v1.3.0

## Current Capabilities

- Payment capture offline via `offlineQueueStore` (localStorage)
- Background drain on reconnect with role-configured sync interval
- Service worker `sync` event triggers client drain via `WILMS_PAYMENT_SYNC`
- IndexedDB upload queue for photos and attachments
- Approver conflict panel at `/approver/sync-conflicts`

## Sync Flow

```
Collector records payment offline
  → local queue (PENDING)
  → online / SW sync event
  → POST /sync/offline/batch
  → financial ops enter PENDING_REVIEW
  → approver approves → payment applied
```

## Remaining Expansion

Offline registration, expenses, reconciliation, and loan pool operations are scaffolded for v1.3.1+ via shared queue and upload infrastructure.
