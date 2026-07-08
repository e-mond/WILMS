# UI Modernization Report — v1.2.3

## Loading Experience

- `QueryStatePanel` with table/card skeleton variants
- `useQueryLoadingPolicy` debounce to prevent flicker
- `LoadingSpinner` for inline states

## v1.2.3 UI Fixes

| Area | Change |
|------|--------|
| Failed messages | Human-readable failure summaries |
| User management | Lifecycle status labels (Invited / Pending setup / Active) |
| Upload previews | Safe blob URL lifecycle |
| User profile modal | Error states, null-safe arrays |
| Borrower status badges | Fallback for unknown statuses |

## Auditor Reports & Collector Reconciliation

Existing executive layout components (`ExecutiveKpiGrid`, `FilterPillBar`, `ManagementToolbar`) provide modernized cards, filters, and responsive tables. Dark mode supported via theme tokens.

## Email UI

Transactional emails use shared layout with WILMS branding, accessible typography, summary cards, and security notices in `templates.ts` / `email-layout.ts`.
