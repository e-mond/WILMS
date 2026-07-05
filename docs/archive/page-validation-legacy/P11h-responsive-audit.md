# P11h Responsive Audit

Date: 2026-06-09  
Breakpoints reviewed against implementation (code + existing responsive tests).

## Breakpoint matrix

| Width | Header | Sidebar trigger | Bottom nav | Main content | Status |
|-------|--------|-----------------|------------|--------------|--------|
| 320px | Simplified bar + overflow | Fixed FAB | Operational roles: 3ÔÇô5 col grid | Full width, `pb-24` when bottom nav | Pass (code) |
| 375px | Same | Same | `whitespace-nowrap` labels | Same | Pass (code) |
| 390px | Same | Same | Same | Same | Pass (code) |
| 414px | Same | Same | Same | Same | Pass (code) |
| 768px (`md`) | Desktop navbar | Hidden (`md:hidden`) | Hidden (`md:hidden`) | No bottom padding | Pass (code) |
| 1024px | Full desktop chrome | Hidden | Hidden | Sidebar + main | Pass (code) |
| 1440px | Full desktop + 2xl datetime | Hidden | Hidden | Unchanged hierarchy | Pass (code) |

## Key responsive rules verified in code

- Mobile header: `md:hidden` on `OfficeShellMobileBar`.
- Desktop navbar: `hidden md:block` on `AppNavbar`.
- Bottom navigation: `fixed inset-x-0 bottom-0 z-50 md:hidden`.
- Sidebar trigger: `md:hidden` on FAB; desktop sidebar `hidden md:flex`.
- Main padding: `pb-24 md:pb-0` only when `bottomNavigation` is set.
- Nav labels: `whitespace-nowrap` on tab-mode `ShellNavLink` labels.

## Automated coverage

- `src/tests/layouts/shells.test.tsx` ÔÇö role shells render with mobile drawer + chrome.
- `src/tests/reports/ReportsIndexPanel.responsive.test.tsx` ÔÇö report layout.
- `src/tests/components/MultiStepForm.test.tsx` ÔÇö step progression UI.

## Manual follow-up (not automated)

- Visual pass at each width on registration wizard + PIN overlay on a real phone.
- Confirm no horizontal scroll on collector admin-fee bottom nav at 320px (label nowrap applied).
