# WILMS v1.8.0 — Performance Report

## Targets

- Dashboard <300ms (cached / IndexedDB fallback offline)
- Holiday page <250ms after warm cache
- Offline startup <1s shell
- Sync <2s typical batch

## Changes

- Self-hosted fonts remove render-blocking Google CSS
- Broader SW shell precache for role home routes
- Automation pass is lightweight heartbeat (defers heavy fan-out to existing schedulers)
