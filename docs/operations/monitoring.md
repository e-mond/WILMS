# WILMS Production Monitoring

**Version:** v1.3.5  
**Last updated:** 2026-07-12

## Health endpoints

| Endpoint | Service | Purpose |
|----------|---------|---------|
| `GET /health` | Railway API | Version, DB, migrations, uploads, schema |
| `GET /api/auth/csrf` | Vercel BFF | Frontend availability probe |

### API health response fields

```json
{
  "status": "ok | degraded",
  "version": "1.3.5",
  "database": { "connected": true, "status": "connected" },
  "migrations": { "expected": 23, "applied": 23, "status": "ok" },
  "uploads": { "valid": true, "cloudinaryConfigured": true },
  "schema": { "status": "ok", "missingTables": [] }
}
```

**Alert when:** `status` is `degraded`, `database.connected` is false, `migrations.status` is not `ok`, or `schema.missingTables` is non-empty.

## Automated smoke checks

```bash
# Production connectivity + critical routes
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
npm run smoke:production -w @wilms/api

# Role-based access via BFF
WILMS_APP_URL=https://wilms.vercel.app \
npm run smoke:rbac -w @wilms/api

# Version consistency after deploy
npm run verify:version
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
npm run verify:version
```

## CI gates (every PR)

| Gate | Command |
|------|---------|
| Type check | `npm run type-check` |
| Lint | `npm run lint` |
| Unit tests | `npm test` + `npm test -w @wilms/api` |
| E2E | `npm run test:e2e -w @wilms/frontend` |
| Bundle budget | `npm run bundle:budget-check` |

## Log signals

| Pattern | Source | Action |
|---------|--------|--------|
| `[api] unhandled error` | API | Investigate stack trace; may indicate 500s |
| `[mail] * failed` | API | Check mail relay secrets |
| `[auth] login-alert notification failed` | API | Non-blocking; verify notification prefs |
| `[schema-health] table probe failed` | API | Run migrations; check Neon connectivity |
| `Export failed` | Frontend | User-facing export error; check browser console |

## Uptime monitoring (recommended)

Configure external probes (e.g. Railway/Vercel integrations or third-party):

1. `GET https://wilms-production.up.railway.app/health` — expect 200, `version` matches release
2. `GET https://wilms.vercel.app/login` — expect 200, body contains `WILMS v1.3.5`
3. Public capture lookup — must not return 401 (see deployment guide)

## Performance budgets

| Metric | Budget | Check |
|--------|--------|-------|
| JS bundle (gzip) | 350 KB | `npm run bundle:budget-check` |
| CSS bundle (gzip) | 100 KB | `npm run bundle:budget-check` |

Current baseline (v1.3.5): **168.6 KB** JS gzip, **9.0 KB** CSS gzip.
