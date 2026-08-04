# Deployment guide

**Purpose:** Deploy and operate WILMS v1.5 on Vercel + Neon.  
**Primary platform:** Vercel. A separate Railway API process is **not** required for the target architecture.

---

## Environments

| Environment | Hosting | Notes |
|---|---|---|
| Local | `npm run dev` | In-process API by default |
| Preview | Vercel Preview | Separate env vars from Production |
| Production | Vercel Production | [wilms.vercel.app](https://wilms.vercel.app) |

---

## Build configuration

Root [`vercel.json`](../vercel.json):

- `installCommand`: `npm ci`
- `buildCommand`: `npm run build -w @wilms/frontend`
- `framework`: `nextjs`
- Cron: `0 6 * * *` → `/api/cron/notifications`

Do **not** add `functions` path globs under `apps/frontend/src/app/...`—Vercel rejects those patterns for this monorepo layout. Set `export const maxDuration` on Route Handlers instead.

---

## Secrets

Configure Preview and Production independently. Minimum set:

See [environment.md](environment.md) production checklist (`DATABASE_URL` pooled, session secret, Redis, public API flags, scheduler/cron secrets, mail/SMS/upload).

---

## Database migrations

```bash
npm run db:migrate -w @wilms/domain
```

Migrations live in `packages/domain/src/db/migrations`. Run against Neon before or immediately after promoting a release that expects new schema. Do not rewrite applied migration history.

---

## Release validation

1. Deploy Preview from the release branch.  
2. `GET /api/wilms/health` — expect `version` matching release, database `connected`.  
3. Login + sample financial read paths.  
4. Invoke Cron manually or wait for schedule; confirm authorization and job summary.  
5. Promote Production.  
6. Re-check health and a short smoke path.

---

## Rollback

1. Redeploy the previous Vercel Production deployment, **or** revert the Git commit on `main` and redeploy.  
2. If dual-run Node API was retained temporarily, point `WILMS_API_MODE=proxy` + `WILMS_API_UPSTREAM` only as an emergency bridge.  
3. Scheduler: Vercel Cron is primary; GitHub Actions notification workflow schedule remains disabled by default.

Details: [`v1.5/FINAL_RELEASE_READINESS.md`](v1.5/FINAL_RELEASE_READINESS.md).

---

## CI

GitHub Actions runs repository CI on pushes/PRs (type-check, tests as configured in workflows). Treat green CI as necessary but not sufficient for financial cutover—run the smoke paths above on Preview/Production.
