# WILMS Offline Device Matrix (Phase 9A)

**Product version:** 1.8.0  
**Branch:** `feature/v1.8.0-offline-pilot-cert`  
**Baseline tag:** `v1.8.0-offline-rc1`  
**Date:** 2026-08-10  
**Language:** British English  

## Environment of this certification run

| Item | Value |
|------|--------|
| Executor | Cursor agent on Windows desktop workspace |
| Physical mobile devices available | **None** |
| Physical tablets available | **None** |
| Safari / iOS available | **None** |
| Samsung Internet available | **None** |
| Staging credentials for live PWA install | **Not used in this run** |

## Matrix

| Platform | Browser | Result | Evidence |
|----------|---------|--------|----------|
| Android phone | Chrome | **BLOCKED** | No Android handset attached to this environment |
| Android phone | Edge | **BLOCKED** | No Android handset |
| Android phone | Samsung Internet | **BLOCKED** | Browser/device unavailable |
| Android tablet | Chrome / Edge | **BLOCKED** | No tablet attached |
| iPad | Safari | **BLOCKED** | No iPad / Safari |
| Desktop Windows | Chrome | **BLOCKED** (interactive PWA) | Agent cannot drive a real Chrome airplane-mode session with SW + VAPID in this run; code-reviewed only |
| Desktop Windows | Edge | **BLOCKED** (interactive PWA) | Same as Chrome |
| Desktop Windows | Firefox | **BLOCKED** | Not executed |
| Desktop macOS | Safari | **BLOCKED** | Host is Windows; Safari unavailable |

## Required to unblock

- At least one Android phone with Chrome (and ideally Edge)
- Optional: Android tablet; iPad Safari
- Desktop Chrome/Edge with DevTools Application → Service Workers + Network Offline
- Deployed or local build with `NEXT_PUBLIC_WILMS_OFFLINE_MODE=true` and valid VAPID keys for push-adjacent checks
- Signed-in collector + Super Admin demo accounts

## Notes

No device results were fabricated. Automated unit/type-check evidence is recorded in Phase 9J / test log section.
