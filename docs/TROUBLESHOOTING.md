# Troubleshooting

**Purpose:** Concrete diagnosis steps for common WILMS v1.5 failures.

---

## UI shows mock data in local development

**Problem:** Lists and dashboards show demo/mock records.  
**Cause:** Frontend mock provider is active when `NEXT_PUBLIC_API_BASE_URL` is empty or `NEXT_PUBLIC_USE_MOCK` is not `false`.  
**Diagnosis:** Inspect `apps/frontend/.env.local`.  
**Resolution:** Set `NEXT_PUBLIC_API_BASE_URL=/api/wilms` and `NEXT_PUBLIC_USE_MOCK=false`, restart `npm run dev`.

---

## `UPSTREAM_UNAVAILABLE` or proxy 503

**Problem:** `/api/wilms` returns upstream unavailable.  
**Cause:** `WILMS_API_MODE=proxy` but Node API is down / wrong `WILMS_API_UPSTREAM`.  
**Diagnosis:** Check env mode; curl upstream `/health`.  
**Resolution:** Start `npm run dev:api`, or remove proxy mode to use in-process handlers.

---

## Production build fails: unmatched `functions` pattern

**Problem:** Vercel error referencing `apps/frontend/src/app/api/...` in `functions`.  
**Cause:** Invalid `vercel.json` `functions` globs for this monorepo.  
**Diagnosis:** Inspect root `vercel.json`.  
**Resolution:** Remove the `functions` map; keep `maxDuration` on Route Handler exports. Fixed on `main` via PR #149.

---

## Health reports old version after deploy

**Problem:** UI is new but `/api/wilms/health` shows prior version.  
**Cause:** Stale deployment or still proxying to an old upstream process.  
**Diagnosis:** Confirm Vercel deployment commit; confirm `WILMS_API_MODE` is unset; compare `gitCommit` in health.  
**Resolution:** Redeploy Vercel; disable proxy; stop obsolete Node API if any.

---

## Rate limit inconsistencies across requests

**Problem:** Limits appear random under load on Vercel.  
**Cause:** In-memory rate limiter without Redis on serverless.  
**Diagnosis:** Check whether `REDIS_URL` / `WILMS_REDIS_URL` is set; health/bootstrap warnings.  
**Resolution:** Provision Redis and set the URL on Preview and Production.

---

## Scheduler did not run

**Problem:** No due-soon / missed-payment notifications.  
**Cause:** Cron misconfigured, unauthorized, or function timeout.  
**Diagnosis:** Vercel Cron logs; manually `GET /api/cron/notifications` with bearer token; check domain notification dedupe tables/events.  
**Resolution:** Ensure Cron path `/api/cron/notifications`, secrets `CRON_SECRET` or `WILMS_SCHEDULER_TOKEN`, and `maxDuration` adequate for volume.

---

## CSRF failures on mutations

**Problem:** 403 CSRF on POST/PATCH from the browser.  
**Cause:** Missing/invalid CSRF cookie or header.  
**Diagnosis:** Confirm request goes through same-origin `/api/wilms` with credentials.  
**Resolution:** Use the app's `apiClient` (includes CSRF); avoid raw cross-origin calls.

---

## Database connection exhaustion

**Problem:** Intermittent 500s / DB errors under concurrency.  
**Cause:** Direct (unpooled) Neon URL on serverless.  
**Diagnosis:** Neon dashboard connections; confirm URL is pooled.  
**Resolution:** Switch `DATABASE_URL` to Neon pooled connection string.
