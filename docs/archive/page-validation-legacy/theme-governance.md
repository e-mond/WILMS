# Theme Governance

Recorded: 2026-06-09

## Policy

The **sidebar always remains executive dark**, regardless of light/dark theme selection for main content.

Main content area may follow user/system theme preference.

## Implementation

| Layer | Behaviour |
|---|---|
| `[data-sidebar='executive']` in `tokens.css` | Forces dark executive palette (sidebar `#161616`, gold accent `#d4af37`) in all themes |
| `DashboardShell` | Sets `data-sidebar="executive"` on sidebar container |
| Main content | Uses `[data-executive-content='true']` dark tokens only when global dark mode active |

## Visual Tokens (Sidebar ÔÇö Always Dark)

- Background: `#161616`
- Gold accent: `#d4af37`
- Text primary: `#f5f5f5`
- Text muted: `#a0a0a0`
- Border: `#333333`

## Validation

- [x] Sidebar dark in light mode
- [x] Sidebar dark in dark mode
- [x] Main content switches with theme toggle
- [ ] JPEG sign-off at 375px / 1280px (pending stakeholder review)
