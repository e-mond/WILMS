# WILMS Offline Performance Report (Phase 9H)

**Product version:** 1.8.0  
**Language:** British English  

## Targets (from Phase 9 brief)

| Metric | Target |
|--------|--------|
| Dashboard from cache | <200ms |
| Cached route transition | <100ms |
| No significant jank on low-end device | Qualitative |

## Measurements this run

| Metric | Result |
|--------|--------|
| First offline load | **BLOCKED** — no instrumented browser session |
| Repeat offline load | **BLOCKED** |
| Cached route transition | **BLOCKED** |
| IndexedDB read latency | **BLOCKED** |
| Cache size / storage usage | **BLOCKED** — would use Application → Cache Storage / Storage estimate on device |
| Memory / low-end responsiveness | **BLOCKED** |

## How to measure (for a future unblocked run)

1. Enable `NEXT_PUBLIC_WILMS_OFFLINE_MODE=true`, load app online once (populate `wilms-v180-shell`).
2. DevTools → Network → Offline.
3. Performance panel: navigate to `/dashboard`, `/borrowers`, `/documentation`.
4. Record `PerformanceNavigationTiming` / LCP where applicable; note SW cache hits in Network waterfalls.

No fabricated timings were entered.
