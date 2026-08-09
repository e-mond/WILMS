# WILMS Offline Architecture

**Version:** 1.8.0  
**Authoritative pack:** [`docs/v1.8.0/OFFLINE_ARCHITECTURE_REPORT.md`](./v1.8.0/OFFLINE_ARCHITECTURE_REPORT.md), [`docs/v1.8.0/OFFLINE_COMPLETION_REPORT.md`](./v1.8.0/OFFLINE_COMPLETION_REPORT.md)

## Overview

WILMS supports field operations in low-connectivity environments. Supported offline **writes** are payments, expenses, and holiday request creates. Other modules rely on service-worker shell caching and IndexedDB read snapshots.

## Components

| Layer | Module | Storage |
|-------|--------|---------|
| Mutation queue | `apps/frontend/src/state/offlineQueueStore.ts` | `localStorage` (`wilms-offline-queue`) |
| Upload queue | `apps/frontend/src/lib/offline-queue/upload-queue.ts` | IndexedDB (`wilms-field-ops`) |
| Sync drain | `apps/frontend/src/hooks/useOfflineQueueSync.ts` + payment/expense/holiday handlers | — |
| Read snapshots | `apps/frontend/src/lib/offline/offlineSnapshotStore.ts` | IndexedDB |
| Service worker | `apps/frontend/public/sw.js` | Cache API (`wilms-v180-shell`) |
| Backend ingest | `packages/domain/src/modules/sync/service.ts` | `offline_sync_operations`, `offline_sync_conflicts` |
| Shell UX | `apps/frontend/src/components/offline/AppOfflineShell.tsx` | Banner + sync panel |

## Capability matrix

| Capability | Mode |
|------------|------|
| Record payment | **Full offline write** → `/sync/offline/batch` → Approver conflict review for financial ops |
| Record expense | **Full offline write** → direct apply when online (no financial conflict queue) |
| Holiday request create | **Full offline write** → batch ingest applies when online |
| Dashboard / notification reads | **Read-cache** (IndexedDB snapshots) |
| Shell navigation (role routes listed in SW) | **Shell cache** (HTML still network-first) |
| Approvals, reconciliation decisions, registration, reports, docs writes | **Online-only** |

## Collector / role UX

- `AppOfflineShell` wraps authenticated layouts and drives sync (pending / failed / review + progress).
- `OfflineBanner` shows offline state and pending queue counts (contextual; not permanent navbar chrome).
- `OfflineInitOverlay` displays during initial sync after reconnect.
- `BackgroundUploadProcessor` drains the upload queue when online.
- Approver workspace surfaces offline backlog metrics and `/approver/sync-conflicts`.

## PWA Shell

Service worker cache name: `wilms-v180-shell`. Precaches shell assets and expanded role routes for collector / officer / approver / auditor / admin navigation.

## Uploads capability matrix

| Upload kind | Permission | Offline | Notes |
|-------------|------------|---------|-------|
| Own profile photo | Authenticated self (no `CAPTURE_DOCUMENTS` required) | Online preferred; upload queue when configured | Server allows own `profile-photo` without document-capture permission |
| Registration / borrower documents | `CAPTURE_DOCUMENTS` | Upload queue when offline-capable path used | Missing permission → **403**; UI must not offer upload |
| Communication Center `DOCUMENT` attachments | `CAPTURE_DOCUMENTS` | Online | Keep 403; AttachmentUploader gated via PermissionGate |
| Cloudinary misconfig | n/a | n/a | Surfaced on `/health` (`uploads.valid`, provider, warnings) — do not weaken RBAC to “fix” uploads |

## Security

- Financial offline payment mutations enter a **review queue** on the server until an approver resolves them (`QUEUED_FOR_REVIEW` / `offline_sync_conflicts`).
- Session cookies remain required for sync API calls.
- Do not advertise unsupported offline writes in UI copy.

## Related

- [v1.8.0 Offline Architecture Report](./v1.8.0/OFFLINE_ARCHITECTURE_REPORT.md)
- [v1.8.0 Offline Completion Report](./v1.8.0/OFFLINE_COMPLETION_REPORT.md)
- [Synchronization Guide](./synchronization-guide.md)
- [Mobile Guide](./mobile-guide.md)
