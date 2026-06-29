# WILMS Deployment Guide

**Last updated:** P14.5G (v0.2.1)

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
WILMS_SMOKE_EMAIL=... \
WILMS_SMOKE_PASSWORD=... \
npm run smoke:production
```

Expected: **15/15** checks (v0.2.1+).

---

## Rollback

Redeploy previous Railway/Vercel deployment. No schema rollback for v0.2.1 (no new migrations).

See `docs/page-validation/P14.5G-rollback-guide.md`.

---

## References

- `docs/page-validation/P14.5G-deployment-report.md`
- `docs/page-validation/P14.5C-deployment-architecture.md`
