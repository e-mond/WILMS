# RC1.3.3 — Root Cause

**Date:** 2026-07-02  
**Verdict:** Production runs stale code + possible schema drift; application code handles empty DB when schema is complete.

## Primary causes

1. **Deploy drift** — Railway `/health` reported `gitCommit: cf3ce10` while GitHub `main` was `8a83278`+ (RC1.2/RC1.3). Production did not run merged recovery code.
2. **RC1.3 not merged** — UX empty states and production error fixes existed only on `release/rc1-3-final-certification` until RC1.3.3 merge.
3. **HTTP 500 on list routes** — Unhandled backend exceptions (likely Postgres `relation/column does not exist` or legacy code paths on `cf3ce10`), not empty-array logic. `/health` only runs `SELECT 1` + migration count; it does not validate business tables.

## Secondary hardening (this release)

- Null-safe `borrowers.profile` and `payments.gps` mappers
- `/health.schema.missingTables` probe for 12 core tables
- Server-side error logging in `error-handler.ts`
- `gitCommit` fallback from `RAILWAY_GIT_COMMIT_SHA`

## Recovery action

Merge RC1.3 → `main`, redeploy Railway + Vercel from same SHA, confirm `/health.schema.status === "ok"`, re-run smoke 29/29.
