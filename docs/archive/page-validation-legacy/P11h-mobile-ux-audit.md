# P11h Mobile UX Audit

Date: 2026-06-09  
Scope: Mobile header, drawer FAB, PIN pad, registration wizard, photo capture.

## 1. Mobile header / overflow menu

| Check | Status | Notes |
|-------|--------|-------|
| Brand left only | Pass | `OfficeShellMobileBar` ÔÇö logo + truncated title |
| Notifications + profile right | Pass | `ShellNavbarActions` with `mobileSimplified` |
| Overflow menu (`MoreVertical`) | Pass | `ShellMobileOverflowMenu` ÔÇö Search, Settings, App Lock, Theme, Connection |
| Desktop unchanged | Pass | `AppNavbar` + full `ShellNavbarActions` at `md+` |
| 44px touch targets | Pass | `h-11 w-11 min-h-[44px] min-w-[44px]` on icon buttons |
| No horizontal scroll / wrap | Pass | `flex-nowrap`, `shrink-0`, truncated brand |

## 2. Floating sidebar trigger

| Check | Status | Notes |
|-------|--------|-------|
| Fixed FAB at left edge | Pass | `MobileSidebarTrigger` ÔÇö `fixed left-0 top-1/2 -translate-y-1/2 z-[60]` |
| Overlays content | Pass | No layout column consumed |
| No content padding for trigger | Pass | `max-md:pl-14` removed from `DashboardShell` |
| 44px target | Pass | `h-11 w-11 min-h-[44px] min-w-[44px]` |

## 3. PIN / App Lock mobile keyboard

| Check | Status | Notes |
|-------|--------|-------|
| Mobile keypad-only | Pass | `useCoarsePointerDevice()` ÔåÆ `inputMode="none"` + `readOnly` |
| Desktop keyboard | Pass | Keyboard handlers active when not coarse/mobile |
| Custom keypad visible | Pass | Centered grid, `max-w-xs` |
| jsdom safety | Pass | `matchMedia` guard for test env |

## 4. Registration wizard progression

| Check | Status | Notes |
|-------|--------|-------|
| Hide future step titles | Pass | `MultiStepForm` `hideFutureSteps` wired in wizard |
| Hide future step content | Pass | Step sections gated by `currentStep === n` |
| Progress shows current + completed | Pass | `visibleSteps = steps.slice(0, currentStep + 1)` |

## 5. GPS auto location

| Check | Status | Notes |
|-------|--------|-------|
| Use current location button | Pass | Beside GPS field in address step |
| Demo mock coordinates | Pass | `locationService.mock` ÔåÆ `DEMO_CURRENT_LOCATION` |
| Permission / unavailable messages | Pass | Friendly errors surfaced via `role="status"` |

## 6. Region ÔåÆ District ÔåÆ City

| Check | Status | Notes |
|-------|--------|-------|
| Cascading selects | Pass | `locationService.getRegions/Districts/Cities` + `useQuery` |
| No hardcoded UI arrays | Pass | Data from location service / mock factory |
| Reset on parent change | Pass | District/city cleared when region/district changes |

## 7. Photo capture (mobile vs desktop)

| Check | Status | Notes |
|-------|--------|-------|
| Mobile: Take + Upload only | Pass | `Capture using mobile` hidden when `isMobileDevice()` |
| Desktop: Take + QR + Upload | Pass | All three actions on desktop |

## 8. Registration print / PDF

| Check | Status | Notes |
|-------|--------|-------|
| 2-page layout | Pass | `registration-agreement-print-html.ts` ÔÇö page 1 + page 2 |
| No loan amount | Pass | `registration-agreement-fields.ts` has no loan/amount fields |
| Required sections present | Pass | Applicant, guarantor, declarations, legal, officer verification, signatures |

## Residual manual checks

- Physical device keyboard suppression on iOS/Android (automated tests use jsdom).
- Reverse geocoding for GPS address (service stub only; coordinates/ demo address populated today).
