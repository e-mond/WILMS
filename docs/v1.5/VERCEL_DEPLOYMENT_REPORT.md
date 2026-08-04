# Vercel Deployment Report — v1.5.0

## Target

Single Vercel project building `@wilms/frontend` from the monorepo root (`vercel.json`).

## Build

- `installCommand`: `npm ci`
- `buildCommand`: `npm run build -w @wilms/frontend`
- Framework: Next.js
- Node: 22+

## Cron

| Path | Schedule | Auth |
|---|---|---|
| `/api/cron/notifications` | `0 6 * * *` (06:00 UTC daily) | `Authorization: Bearer` `CRON_SECRET` or `WILMS_SCHEDULER_TOKEN` |

Requires Vercel Pro (or higher) for one-minute minimum cron granularity; daily schedule is within Hobby/Pro limits.

## Environment parity checklist

Set on **Preview** and **Production** separately:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string |
| `WILMS_SESSION_SECRET` | HMAC session signing |
| `WILMS_SCHEDULER_TOKEN` | Scheduler / cron auth |
| `CRON_SECRET` | Vercel Cron bearer (recommended) |
| `REDIS_URL` / `WILMS_REDIS_URL` | Shared rate limiting (required in serverless production) |
| `NEXT_PUBLIC_API_BASE_URL` | `/api/wilms` |
| `NEXT_PUBLIC_USE_MOCK` | `false` |
| Mail / SMS / Cloudinary / metrics tokens | Same as former Railway set |

Optional dual-run only:

| Variable | Purpose |
|---|---|
| `WILMS_API_MODE=proxy` | Forward to upstream instead of in-process |
| `WILMS_API_UPSTREAM` | Former Railway / local `:4000` |

## Verification

1. Deploy Preview from `v1.5-platform-consolidation`.
2. `GET /api/wilms/health` → `version: 1.5.0`, DB connected.
3. Login + financial smoke on Preview against Neon.
4. Manually invoke Cron or wait for 06:00 UTC; confirm scheduler audit/dedupe.
5. Promote Production after checkpoint sign-off.
