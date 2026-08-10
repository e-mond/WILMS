# WILMS State Persistence Report (Phase 9C)

**Product version:** 1.8.0  
**Language:** British English  

## What the code persists today (evidence)

| State | Mechanism | Path |
|-------|-----------|------|
| Theme light/dark | Zustand persist → localStorage | `apps/frontend/src/state/themeStore.ts` |
| Sidebar collapsed | Zustand persist → localStorage | `apps/frontend/src/state/shellLayoutStore.ts` |
| Offline mutation queue | Zustand persist → localStorage `wilms-offline-queue` | `apps/frontend/src/state/offlineQueueStore.ts` |
| App lock PIN/settings | Zustand persist → localStorage | `apps/frontend/src/state/appLockStore.ts` |
| Login preferences | Zustand persist → localStorage | `apps/frontend/src/state/loginPreferencesStore.ts` |
| Read snapshots | IndexedDB | `apps/frontend/src/lib/offline/offlineSnapshotStore.ts` |
| Upload queue blobs | IndexedDB `wilms-field-ops` | `apps/frontend/src/lib/offline-queue/upload-queue.ts` |

## What is **not** claimed as persisted

| State | Status |
|-------|--------|
| Search terms / table filters | Not generally durable across full browser restart (unless page-specific URL query) |
| Selected borrower/group in memory | Lost on full close unless URL encodes id |
| Expanded panels | Typically ephemeral |
| Unsaved registration wizard fields | Server draft if saved; local Files not revived (upload IDs only) |
| Scroll position | Browser-dependent; not WILMS-owned durable store |

## Close browser / reopen (device)

| Check | Result |
|-------|--------|
| Theme restored | **BLOCKED** — interactive browser restart not executed |
| Sidebar restored | **BLOCKED** |
| Offline queue restored | **BLOCKED** (expected PASS from persist middleware; not device-proven here) |
| Draft registration fields | **BLOCKED** |
| Scroll / selection | **BLOCKED** |

## Conclusion

Persistence architecture is documented from code. End-to-end “close completely → reopen” certification remains **BLOCKED** until a real browser session is run.
