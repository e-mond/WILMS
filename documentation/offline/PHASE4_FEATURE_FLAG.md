# WILMS Offline Phase 4 — Feature Flag Infrastructure

**Product version:** 1.8.0  
**Phase:** 4 — Feature flag boundary  
**Language:** British English  

## What shipped

| Flag | Default | Surfaces |
|------|---------|----------|
| `WILMS_OFFLINE_MODE` / `WILMS_FLAG_OFFLINE_MODE` | `false` | Domain `getFeatureFlags().offlineMode` |
| `NEXT_PUBLIC_WILMS_OFFLINE_MODE` | `false` | Frontend `isOfflineModeEnabled()` |

## Behaviour contract

When **disabled** (default):

- No new offline-first sprint expansions activate.
- Existing collector payment / expense / holiday queues continue as today (pre-sprint production behaviour).
- Shell, banners, and sync paths that already exist remain unchanged.

When **enabled**:

- Future Phase 5+ code may gate shell fallback, expanded read caches, and IndexedDB queue migration behind this flag.

## Evidence

- `packages/domain/src/config/feature-flags.ts`
- `packages/domain/src/tests/platform/feature-flags.test.ts`
- `apps/frontend/src/config/offline-mode.ts`
- `apps/frontend/src/tests/config/offline-mode.test.ts`
- `apps/frontend/.env.production.example`

## Next

Phase 5 — minimal shell/static caching + banner/indicator gated by this flag (**no** new financial write queues).
