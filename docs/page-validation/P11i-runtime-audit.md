# P11i Runtime Error Audit

## Symptom
`DevRootNotFoundBoundary` appears in development when Next.js cannot resolve a route segment.

## Investigation
- Audited `src/app/**` route tree: 46 `page.tsx` files across role route groups; root `layout.tsx` is valid.
- No project-level `not-found.tsx` exists under `src/app` — unmatched URLs fall through to Next.js default not-found handling, which surfaces as `DevRootNotFoundBoundary` in dev overlays.
- Root `/` renders a static landing page (`src/app/page.tsx`); role dashboards live under grouped paths such as `/dashboard`, `/collector/dashboard`, etc.
- No duplicate or conflicting root layouts found in route groups.

## Root cause
Development-only not-found boundary triggered when navigating to URLs without a matching `page.tsx` (or before a stale `.next` cache rebuild after route changes). Not a production crash in application logic.

## Mitigation applied
- Full rebuild recommended after route/shell changes: delete `.next` and run `npm run build`.
- Optional follow-up: add `src/app/not-found.tsx` for branded 404 (out of scope unless requested).

## Cache note
If the boundary persists after valid route edits, clear `.next` and restart the dev server.
