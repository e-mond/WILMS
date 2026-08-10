# WILMS Service Worker Lifecycle Report (Phase 9D)

**Product version:** 1.8.0  
**Cache name:** `wilms-v180-shell`  
**Language:** British English  

## Documented behaviour (code)

| Event | Behaviour | Source |
|-------|-----------|--------|
| Install | Precache `SHELL_ASSETS` with `Promise.allSettled` | `public/sw.js` |
| Activate | Delete keys ≠ `CACHE_VERSION`; `clients.claim()` | `public/sw.js` |
| Message `SKIP_WAITING` | `skipWaiting()` | `public/sw.js` + update prompt |
| Message `WILMS_SET_OFFLINE_MODE` | Sets in-memory `offlineModeEnabled` | Phase 5 |
| Fetch navigate (flag off) | Bypass (network default) | `shouldBypassCache` |
| Fetch navigate (flag on, shell path) | Network then cache fallback | Phase 5 |
| Fetch shell GET | Cache match then network | `sw.js` |
| Background sync tag | Posts `WILMS_PAYMENT_SYNC` to clients | `sw.js` |

## Device / deploy lifecycle checks

| Check | Result |
|-------|--------|
| First install | **BLOCKED** |
| Update deployment | **BLOCKED** |
| Cache invalidation / old cache cleanup | **BLOCKED** (activate logic reviewed only) |
| Waiting state + refresh after deploy | **BLOCKED** |
| Rollback behaviour | **BLOCKED** — rollback path = redeploy prior build + flag false; tag `v1.8.0-offline-rc1` |

## Risk

In-memory offline-mode flag resets when the worker restarts until the client re-posts the message (registrar posts on register/update).
