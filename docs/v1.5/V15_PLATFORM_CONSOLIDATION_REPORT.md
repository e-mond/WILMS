# WILMS v1.5 Platform Consolidation Report

**Release:** v1.5.0  
**Branch:** `v1.5-platform-consolidation`  
**Date:** August 2026

## Summary

WILMS is consolidated into a **single Vercel-deployable Next.js application**. Domain logic, Drizzle/Neon access, and the HTTP application layer live in `@wilms/domain`. The Next.js app serves UI and API (`/api/wilms/*`) same-origin. Vercel Cron replaces the GitHub Actions daily scheduler trigger. Railway is no longer required for production.

## Architecture outcome

| Before (v1.4.3) | After (v1.5.0) |
|---|---|
| Next.js on Vercel | Next.js on Vercel (UI + API) |
| Express on Railway | `@wilms/domain` HTTP app hosted in Route Handlers |
| BFF proxy to Railway | In-process handler (optional `WILMS_API_MODE=proxy` dual-run) |
| GHA cron → Railway | Vercel Cron → `/api/cron/notifications` |
| Neon Postgres | Neon Postgres (unchanged schema/migrations) |

## Auth model

Custom HMAC `wilms_session` cookies are preserved. This release does **not** migrate to Auth.js/NextAuth.

## Financial / security integrity

RBAC, maker-checker, idempotency, SQL financial aggregations, audit logging, request IDs, and notification deduplication are unchanged at the domain layer. Transport only moved.

## Packages

| Package | Role |
|---|---|
| `@wilms/frontend` | Next.js App Router UI + Route Handlers |
| `@wilms/domain` | Domain services, DB, HTTP app, schedulers |
| `@wilms/api` | Thin Node listen adapter (local dual-run / rollback) |
| `@wilms/shared-*` | Shared contracts, RBAC, types, utils, validation |

## Review checkpoints

1. **After Phase B** — Route Handler transport live; financial/RBAC/notification suites must pass before further cutover.
2. **After Phase E** — Vercel Cron verified before retiring GHA/Railway triggers permanently.
3. **Final DoD** — Human sign-off before merge to `main` and Railway decommission.

## Related reports

- `ARCHITECTURE_MIGRATION_REPORT.md`
- `VERCEL_DEPLOYMENT_REPORT.md`
- `API_ROUTE_HANDLER_REPORT.md`
- `SCHEDULER_MIGRATION_REPORT.md`
- `SECURITY_REPORT.md`
- `FINAL_RELEASE_READINESS.md`
