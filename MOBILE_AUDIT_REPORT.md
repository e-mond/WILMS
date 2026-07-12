# Mobile Audit Report — v1.3.6-rc1

**Date:** 2026-07-12

---

## Responsive

| Area | Status |
|------|--------|
| Collector settings | Mobile nav pills unchanged — one fewer section (PIN removed) |
| Collectors management | `CollectorsMobileCardList` unchanged |
| App lock E2E | Mobile project in Playwright config (iPhone 12 viewport) |

## PWA / offline

No changes to service worker or offline sync in this RC.

## Touch

App Lock PIN pad — 44px min touch targets retained (`PinEntryPad.tsx`).

## Camera / QR

No changes.

## Evidence

Prior E2E: `responsive-breakpoints.spec.ts` PASS (v1.3.5 cycle). Collector settings path updated in `app-lock.spec.ts` for v1.3.6.
