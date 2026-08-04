# RC1.4 — Navigation & Online Status

**Status:** IMPLEMENTED

## Change

Moved connection status from navbar to a fixed floating bar:

- Component: `ConnectionStatusBar.tsx`
- Placement: bottom-right (desktop), bottom-center (mobile)
- Removed from `ShellNavbarActions` and mobile overflow menu

## States

Online, Offline, Reconnecting, Sync Pending, Degraded — sourced from `useSystemStatus.ts` + `useOfflineStatus.ts`.

## E2E

Update `shell-navbar.spec.ts` to assert floating status bar presence when running E2E locally.
