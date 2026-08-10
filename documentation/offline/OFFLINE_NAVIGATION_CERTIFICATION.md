# WILMS Offline Navigation Certification (Phase 9B)

**Product version:** 1.8.0  
**Flag under test:** `WILMS_OFFLINE_MODE` / `NEXT_PUBLIC_WILMS_OFFLINE_MODE=true`  
**Language:** British English  

## Code-path expectations (from repository)

Source: [`apps/frontend/public/sw.js`](../../apps/frontend/public/sw.js), [`ServiceWorkerRegistrar.tsx`](../../apps/frontend/src/components/pwa/ServiceWorkerRegistrar.tsx).

| Behaviour | When flag **false** (default) | When flag **true** + SW message received |
|-----------|-------------------------------|------------------------------------------|
| Navigate to precached shell route | Network-only (navigate bypasses cache) | Network-first; on network failure → Cache API for pathname, else `/login` or `/` |
| `/api/*`, `/_next/*`, `/capture/*` | Never cached as truth | Never cached as truth |
| Non-shell deep links | No SW respondWith | No SW respondWith |

Precached routes include dashboard, borrowers, groups, loans, documentation, notifications, settings, collector/officer/approver/auditor shells (see `SHELL_ASSETS` in `sw.js`).

## Interactive certification (device)

| Check | Result |
|-------|--------|
| Airplane before open app | **BLOCKED** — no device session |
| Airplane after app loaded | **BLOCKED** |
| Refresh while offline | **BLOCKED** |
| Hard refresh while offline | **BLOCKED** |
| Browser restart | **BLOCKED** |
| Tab duplication | **BLOCKED** |
| Cached route navigation | **BLOCKED** |
| Back/forward | **BLOCKED** |
| Scroll restoration | **BLOCKED** |

## Route checklist (device — all BLOCKED)

Dashboard, borrower list/detail, group list/detail, loan list/detail, documentation, notifications, settings — **BLOCKED** pending Phase 9A hardware.

## Automated / static review

| Check | Result |
|-------|--------|
| Flag defaults false | **PASS** — `feature-flags.test.ts`, `offline-mode.test.ts` |
| SW starts with `offlineModeEnabled = false` | **PASS** — code review `sw.js` |
| Registrar posts `WILMS_SET_OFFLINE_MODE` | **PASS** — code review `ServiceWorkerRegistrar.tsx` |

## Risks

- Flag on without prior successful precache visit → blank/fallback login page offline.
- HTML shell cache may be stale after deploy until update prompt + refresh.
