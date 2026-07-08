# WILMS Synchronization Guide

**Version:** 1.3.0

## Payment Sync Flow

```
Collector (offline)
  → offlineQueueStore.enqueue(RECORD_PAYMENT)
  → connectivity restored OR service worker sync event
  → useOfflineQueueSync drains queue (FIFO)
  → POST /sync/offline/batch
  → server: QUEUED_FOR_REVIEW + conflict row
  → approver: /approver/sync-conflicts
  → POST /sync/conflicts/:id/approve
  → payment applied via recordPayment()
```

## API Endpoints

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| POST | `/sync/offline/batch` | `RECORD_COLLECTIONS` | Ingest offline operations |
| GET | `/sync/conflicts` | `APPROVE_LOANS` | List pending conflicts |
| POST | `/sync/conflicts/:id/approve` | `APPROVE_LOANS` | Apply queued operation |
| POST | `/sync/conflicts/:id/reject` | `APPROVE_LOANS` | Reject queued operation |

## Client Configuration

Collector settings (Settings → Sync) control:

| Setting | Default | Effect |
|---------|---------|--------|
| Auto sync | On | Disables periodic drain when off |
| Sync interval | 15 min | Retry interval while online (min 30s, max 15m) |
| Low data mode | Off | Compresses images before upload |

Battery saver (≤20% and not charging) pauses background sync automatically.

## Background Sync

1. Client registers `wilms-payment-sync` via `SyncManager` when available.
2. Service worker `sync` event posts `WILMS_PAYMENT_SYNC` to open clients.
3. `CollectorOfflineShell` listens and triggers `runSync()`.

## Upload Sync

Files staged in IndexedDB are uploaded by `BackgroundUploadProcessor` when `navigator.onLine` is true. Failed uploads remain in the queue for retry.

## Conflict Resolution

Approvers review operations at **Approver → Offline Sync**. Each conflict shows the operation ID, reason, and queued timestamp. Approval applies the underlying payment; rejection marks the conflict resolved without posting.

## Idempotency

Offline batch items use client-generated `idempotencyKey` (queue item ID). Duplicate submissions return `DUPLICATE` and are removed from the client queue.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Queue not draining | Auto sync enabled; device online; battery not in saver mode |
| "Sync complete" but payment missing | Operation may be pending approver review |
| Upload stuck | Storage quota; IndexedDB pending uploads in Device health panel |
