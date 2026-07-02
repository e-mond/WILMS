# WILMS Deployment Guide

**Last updated:** RC1.2 (v0.2.2)

---

## Architecture

| Component | Platform | Deploy from |
|-----------|----------|-------------|
| Frontend | Vercel | **Monorepo root** (`vercel.json`) |
| API | Railway | **Monorepo root** (`Dockerfile`, `railway.toml`) |
| Database | Neon PostgreSQL | Migrations via Drizzle |
| Uploads | Cloudinary | Env vars on Railway |

**Never deploy Express from `apps/backend/` alone** — context must include workspace packages.

---

## Railway (API)

```bash
# From repo root
railway up
```

Required env vars: `DATABASE_URL`, `WILMS_SESSION_SECRET`, `WILMS_CORS_ORIGIN`, Cloudinary credentials.

Verify:

```bash
curl https://wilms-production.up.railway.app/health
```

---

## Vercel (Frontend)

```bash
vercel deploy --prod
```

Required env vars:

- `NEXT_PUBLIC_API_BASE_URL` — public API URL
- `WILMS_API_UPSTREAM` — Railway API for BFF proxy
- `NEXT_PUBLIC_USE_MOCK=false`

Primary domain: `https://wilms.vercel.app`

---

## Post-Deploy Validation

```bash
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
npm run smoke:production

WILMS_APP_URL=https://wilms.vercel.app \
npm run smoke:rbac
```

Expected: **29/29** production checks + **11/11** RBAC probes (RC1.2). Migrations: **11/11** (`0000`–`0010`).

---

## Rollback

Redeploy previous Railway/Vercel deployment. v0.2.2 adds migration `0007_offline_sync` (8/8); rollback requires schema consideration.

See `docs/page-validation/P14.5G-rollback-guide.md`.

---

## References

- `docs/page-validation/RC1.2-final-report.md`
- `docs/page-validation/RC1.1-production-verification.md`
- `docs/page-validation/P14.6.3-production-acceptance.md`
- `docs/page-validation/P14.5G-deployment-report.md`
