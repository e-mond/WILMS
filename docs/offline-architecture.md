# WILMS Offline Architecture

**Version:** 1.3.0

## Overview

WILMS supports field operations in low-connectivity environments. Collectors can record payments offline; the platform queues mutations locally and synchronizes when connectivity returns.

## Components

| Layer | Module | Storage |
|-------|--------|---------|
| Payment queue | `apps/frontend/src/state/offlineQueueStore.ts` | `localStorage` (`wilms-offline-queue`) |
| Upload queue | `apps/frontend/src/lib/offline-queue/upload-queue.ts` | IndexedDB (`wilms-field-ops`) |
| Sync drain | `apps/frontend/src/lib/offline-queue/sync.ts` | — |
| Service worker | `apps/frontend/public/sw.js` | Cache API (`wilms-v130-shell`) |
| Backend ingest | `apps/backend/src/modules/sync/service.ts` | `offline_sync_operations`, `offline_sync_conflicts` |

## Supported Offline Operations

| Operation | Status |
|-----------|--------|
| Record payment | Supported |
| Photo / attachment upload | Queued in IndexedDB (v1.3.0) |
| Borrower registration | Online only (v1.3.1 planned) |
| Expenses / reconciliation | Online only (v1.3.1 planned) |

## Collector UX

- `CollectorOfflineShell` wraps the collector layout and drives sync.
- `OfflineBanner` shows offline state and pending queue count.
- `OfflineInitOverlay` displays during initial sync after reconnect.
- `BackgroundUploadProcessor` drains the upload queue when online.

## PWA Shell

The service worker precaches shell assets (`/`, `/login`, `/collector/dashboard`, icons, manifest) so installed PWAs can load core navigation without network.

Manifest `start_url` is `/collector/dashboard` for field-first installs.

## Security

- Financial offline mutations enter a **review queue** on the server until an approver resolves them.
- Session cookies remain required for sync API calls.
- Sensitive payloads should be encrypted at rest in a future release (REQ-087).

## Related

- [Synchronization Guide](./synchronization-guide.md)
- [Device Management](./device-management.md)
- [Mobile Guide](./mobile-guide.md)
