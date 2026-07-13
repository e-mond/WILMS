# Accessibility Report — v1.3.7

**Date:** 2026-07-13  
**Target:** WCAG 2.2 AA  
**Verdict:** **NOT CERTIFIED** — full audit not executed

---

## Scope

v1.3.7 introduces dashboard chart preferences, reconciliation summary cards, product tour overlay, registration character counters, and groups table truncation. No deliberate removal of accessibility patterns from prior releases.

---

## Automated audit

| Tool | Environment | Result |
|------|-------------|--------|
| axe-core | Production | **NOT RUN** |
| axe-core | Local build | **NOT RUN** |
| Lighthouse accessibility | Production | **NOT RUN** |
| Pa11y | CI | **NOT CONFIGURED** |

---

## Code review (changed components)

| Component | Keyboard | ARIA / semantic | Contrast | Notes |
|-----------|----------|-----------------|----------|-------|
| `DashboardFinancialAnalyticsPanel` | Inherited | Chart labels truncated with `title` tooltips | Not measured | Text overflow handled |
| `DashboardReconciliationSummary` | Button/link patterns | Status badges use semantic text | Not measured | |
| `ProductTourOverlay` | Escape / focus trap | Modal dialog pattern | Not measured | ESLint exhaustive-deps warning |
| `GroupsManagementPanel` | Table navigation | Truncation + `title` on cells | Not measured | |
| Registration counters | Form fields | `aria-describedby` not verified | Not measured | Character count visible |
| `PinEntryPad` (App Lock) | Prior release | `role="status"` on digits | Maintained | Unchanged |
| `ShellNavLink` | Tested | `ShellNavLink.test.tsx` | — | PASS |

---

## WCAG 2.2 AA checklist

| Criterion | Status |
|-----------|--------|
| 1.4.3 Contrast (minimum) | **NOT MEASURED** |
| 2.1.1 Keyboard | **NOT FULLY TESTED** |
| 2.4.3 Focus order | **NOT TESTED** |
| 2.4.7 Focus visible | **NOT TESTED** |
| 4.1.2 Name, role, value | **PARTIAL** — component tests only |
| 1.4.4 Resize text (200%) | **NOT TESTED** |
| 2.3.3 Animation (reduced motion) | Product tour respects `prefers-reduced-motion` in code — **not manually verified** |

---

## Prior release baseline

v1.3.6-rc1 accessibility report noted no regressions in changed files. v1.3.7 maintains existing patterns; **full screen-by-screen axe re-run is recommended on staging after migrations**.

---

## Verdict

**Accessibility certification cannot be issued** without automated axe/Lighthouse runs and manual screen-reader testing. No known regressions from code review alone.
