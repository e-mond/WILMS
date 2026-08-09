# Updated Technical Guide — v1.8.0

## Key modules

- `modules/organization-holidays/ghana-provider.ts`
- `modules/holiday-requests/*`
- `modules/automation/*`
- Frontend: `lib/fonts.ts`, `components/ui/Calendar.tsx`, `components/ui/Card.tsx`

## Migrations

- `0036_v175_holiday_requests`
- `0037_v180_ghana_holiday_provider`
- `0038_v180_automation_engine`

## CSP

Fonts are self-hosted via `next/font`; CSP keeps `font-src 'self' data:` without Google allowlists.
