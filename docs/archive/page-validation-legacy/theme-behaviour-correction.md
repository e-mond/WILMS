# Theme Behaviour Correction (P11g-A)

**Verified:** 2026-06-13 against codebase after P11g changes.

## Requirement

| Mode | Sidebar | Content |
|------|---------|---------|
| **Dark** | Executive dark (`#161616`) | Dark theme tokens |
| **Light** | Follows active theme tokens (no forced dark) | Light theme tokens |

## Root Cause (P11f)

`src/styles/tokens.css` applied unconditional `[data-sidebar='executive']` overrides (dark palette + `color-scheme: dark`) in all modes, and `aside[data-sidebar='executive']` hard-coded `#161616`.

## Fix Applied

**File:** `src/styles/tokens.css`

1. Light `:root` sets `--color-executive-sidebar: #ffffff` (card-aligned).
2. Removed unconditional `[data-sidebar='executive']` dark block.
3. Executive dark overrides scoped to `.dark [data-sidebar='executive']` and `[data-theme='dark'] [data-sidebar='executive']` only.
4. `aside[data-sidebar='executive']` uses `var(--color-executive-sidebar)` and `var(--color-text-primary)`.

**Related:** `ShellNavLink.tsx` executive hover uses `hover:bg-background` (not `hover:bg-white/10`). `AppSidebar.tsx` collapse control matches.

## Verification Matrix

| Surface | Light mode | Dark mode |
|---------|------------|-----------|
| Desktop expanded sidebar | `bg-executive-sidebar` ÔåÆ white/card tokens | Executive dark |
| Desktop collapsed sidebar | Same token path | Executive dark |
| Mobile drawer (`Drawer.tsx` + `data-sidebar="executive"`) | Theme tokens via CSS vars | Executive dark |
| Tablet drawer | Same as mobile (`md:hidden` trigger) | Same |
| Super Admin | `SuperAdminShell` ÔåÆ `OfficeShell` | OK |
| Collector | `CollectorShell` + `mobileHeader` drawer | OK |
| Registration Officer | `RegistrationOfficerShell` | OK |
| Approver | `ApproverShell` | OK |
| Auditor | `AuditorShell` | OK |

## Evidence

```css
/* Light :root */
--color-executive-sidebar: #ffffff;

/* Dark only */
.dark [data-sidebar='executive'],
[data-theme='dark'] [data-sidebar='executive'] {
  --color-executive-sidebar: #161616;
  color-scheme: dark;
}
```

Content area dark tokens remain on `[data-executive-content='true']` under `.dark` / `[data-theme='dark']` (unchanged).
