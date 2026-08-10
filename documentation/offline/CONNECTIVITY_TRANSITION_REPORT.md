# WILMS Connectivity Transition Report (Phase 9E)

**Product version:** 1.8.0  
**Language:** British English  

## Expected UI (from code)

| Signal | Implementation |
|--------|----------------|
| Offline banner | `OfflineBanner` via `useOfflineStatus` / `AppOfflineShell` |
| Sync panel | `OfflineSyncStatusPanel` — pending / failed / review counts |
| Reconnect drain | `useOfflineQueueSync` |
| Background sync nudge | SW `sync` → client payment sync message |

## Transition matrix

| Scenario | Result |
|----------|--------|
| Online → offline | **BLOCKED** (device) — expected: banner + queue enqueue for supported writes |
| Offline → online | **BLOCKED** — expected: drain queue |
| Unstable / repeated disconnects | **BLOCKED** |
| Captive portal | **BLOCKED** |
| High latency / 2G / 3G / 4G throttle | **BLOCKED** — requires DevTools throttling on a real browser |
| Wi-Fi ↔ mobile switching | **BLOCKED** |

## Auth during transitions

See Phase 9F. No fabricated observations of duplicate requests or stale UI were recorded in this environment.
