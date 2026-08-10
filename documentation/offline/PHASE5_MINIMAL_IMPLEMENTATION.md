# WILMS Offline Phase 5 — Minimal Implementation

**Product version:** 1.8.0  
**Phase:** 5 — Minimal shell / navigation offline support  
**Language:** British English  

## Scope delivered

| Item | Status |
|------|--------|
| App shell caching | Existing `wilms-v180-shell` precache retained |
| Static asset / documentation routes | Already in `SHELL_ASSETS` (`/documentation`, icons, manifest) |
| Navigation offline support | **New:** network-first navigate with **cache fallback** for precached routes **only when** offline mode flag is enabled |
| Local state persistence | Existing offline queue + snapshots unchanged |
| Sync indicator / offline banner | Existing `AppOfflineShell` / `OfflineBanner` / sync panel unchanged |
| Payment / recon queues | **Not modified** |

## Flag behaviour

| `WILMS_OFFLINE_MODE` / `NEXT_PUBLIC_WILMS_OFFLINE_MODE` | Navigate behaviour |
|----------------------------------------------------------|--------------------|
| `false` (default) | Navigations remain network-only (pre-Phase-5 parity) |
| `true` | Client posts `WILMS_SET_OFFLINE_MODE` to SW; failed navigations to precached shell routes fall back to Cache API |

## Code touched

- `apps/frontend/public/sw.js`
- `apps/frontend/src/components/pwa/ServiceWorkerRegistrar.tsx`
- `apps/frontend/src/constants/pwa.ts` (`PWA_SW_SET_OFFLINE_MODE`)

## Explicit non-goals (this phase)

- No new financial write queues  
- No reconciliation / registration sync  
- No PDF receipts  

## Next

Phase 6 — full test report (`PHASE6_TEST_REPORT.md`) including airplane-mode checks with flag on/off.
