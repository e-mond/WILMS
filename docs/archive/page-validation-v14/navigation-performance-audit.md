# Navigation Performance Audit

Audit date: 2026-06-09  
Trigger: Sidebar clicks on Loan Pools, Risk & Flags, Reports, Settings felt frozen.

## Root causes

| Issue | Impact | Location |
|---|---|---|
| No route-level code splitting | First visit downloads full panel + export libs | All `page.tsx` under `(super-admin)` |
| No `loading.tsx` | Blank main area during chunk fetch | `(super-admin)/` |
| 12× `usePathname` + `useSearchParams` per nav | Re-render storm on every route change | `ShellNavLink` × 12 |
| Aside slot double-update on navigation | Cleanup `setContent(null)` then remount set | `useShellAsideContent` |
| Unstable aside context object | Subscribers re-render on every content change | `AsideSlotContext` (fixed) |
| Heavy export barrel | jspdf + exceljs pulled with `WilmsExportActions` | `@/features/export` |
| Mock 300ms delay × multiple queries | Risk/Settings/Reports feel sluggish | `simulateDelay()` |
| Loan pools aside unstable timestamps | Extra aside re-renders | `LoanPoolsPanel` `recentActivity` |

## Implemented optimizations

### Shell / navigation

1. **Split `AsideSlotContext`** into stable dispatch + content contexts — subscribers no longer re-render when only unrelated state changes.
2. **`useShellAsideContent`** now depends on stable `dispatch` only.
3. **`ShellNavigation`** centralizes pathname/search in one `Suspense` boundary; passes `isActive` to links (1 subscription instead of 12).
4. **`DashboardShell`** only closes drawers when actually open (avoids redundant Zustand updates).
5. **`ShellAsideDrawer` FAB** renamed to **Details** (contextual, not alert-specific).

### Route loading

6. **`(super-admin)/loading.tsx`** — instant loading spinner during transitions.
7. **`next/dynamic`** on heavy pages: Settings, Loan Pools, Risk & Flags, Reports.

### Bundle weight

8. **`WilmsExportActions`** — Excel/PDF engines dynamically imported on button click; CSV/print remain synchronous.

### Page fixes

9. **`LoanPoolsPanel`** — stable activity timestamps; dedicated **`LoanPoolsMobileCardList`** for mobile (table hidden `<lg`).
10. **`CollectorDashboardPanel`** — mobile borrower cards + quick actions row; desktop table preserved `md+`.

## Remaining recommendations

| Item | Priority |
|---|---|
| Defer `OverpaymentReviewPanel` on Risk Flags route | Medium |
| Remove duplicate `useSettingsUsers` in Settings export path | Medium |
| Reduce `MOCK_SERVICE_DELAY_MS` for shell chrome queries | Low |
| `@next/bundle-analyzer` per-route report | Low |
| Prefetch tuning for sidebar links | Low |

## Expected outcome

- Sidebar clicks show **loading UI immediately** via `loading.tsx` + dynamic `loading` fallbacks.
- **No aside null→content flicker** from unstable context.
- **Smaller initial chunks** for Settings/Reports/Risk (export libs deferred).
- Navigation should feel **responsive** even while mock data loads.

## Validation

```bash
npm run lint
npm run type-check
npm run dev
# Click: Loan Pools → Risk & Flags → Reports → Settings
```
