# WILMS Release Notes — v1.5.1

**Vercel API runtime recovery**

## Highlights

- Fixes production `/api/wilms/*` returning Next.js HTML 500 pages after the v1.5 consolidation.
- Domain bootstrap no longer throws at import when `WILMS_SESSION_SECRET` is unset on serverless.
- Route Handlers lazy-load `@wilms/domain` and return JSON errors when the in-process API cannot start.
- Upstream proxy is used only when `WILMS_API_UPSTREAM` is a valid `http(s)` URL.

## Who is affected

All staff portals calling `/api/wilms/*` on Vercel (dashboard, borrowers, loans, notifications, health).

## Upgrade notes

1. Deploy this release to Vercel Production.
2. Confirm `GET /api/wilms/health` returns JSON (not an HTML `/500` page).
3. Set on Vercel Production (required for real auth and data):
   - `WILMS_SESSION_SECRET` — same value previously used on Railway
   - `DATABASE_URL` — Neon pooled connection string
   - Optional: `REDIS_URL` / `WILMS_REDIS_URL` for shared rate limits
   - `NEXT_PUBLIC_USE_MOCK=false`
   - `WILMS_API_MODE=inprocess`
4. Remove or correct any non-URL `WILMS_API_UPSTREAM` value left from the BFF era.

## Git

- Tag: `v1.5.1`
- Prior consolidation tag: `v1.5.0`
