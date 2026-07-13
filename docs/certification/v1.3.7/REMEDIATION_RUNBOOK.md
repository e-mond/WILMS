# Production Remediation Runbook — v1.3.7

**Date:** 2026-07-13  
**Branch:** `cursor/v137-prod-remediation-8847`

This runbook resolves production certification blockers without application feature changes.

---

## Root causes identified

| Issue | Cause | Fix |
|-------|-------|-----|
| `migrations_behind` | Journal missing `0024`/`0025`; production on commit without journal fix | Merge remediation PR; Railway redeploy runs `drizzle-kit migrate` via `start:prod` |
| `schema_missing_tables` | Migration `0020` journaled but tables absent (historical journal drift) | New idempotent migration `0026_v137_prod_schema_repair` |
| Smoke auth 401 | Demo accounts disabled on live | Use `WILMS_SMOKE_*` production credentials |
| False smoke pass on degraded health | Smoke accepted `status=degraded` | Smoke now requires `status=ok` |

---

## Deploy failure (2026-07-13)

If Railway deploy fails on boot, check logs for `drizzle-kit migrate failed`.

**Fixed in PR #110:** migration `0023` dedupes reconciliation rows before unique index; FK constraint is idempotent.

**Fixed in PR #111:** migration `0025` skips orphaned `loan_pool_id` rows.

After merge to `main`, trigger redeploy:

1. **Railway dashboard** → WILMS API service → Deployments → Redeploy latest commit (`e2becb2` or newer), or
2. **GitHub Actions** → Deploy Production → Run workflow → `confirm=deploy`

Verify new commit in health:

```bash
curl -fsS https://wilms-production.up.railway.app/health | jq '.data.gitCommit, .data.status, .data.migrations'
```

---

## Operator sequence

### 1. Merge and deploy API

Merge PR to `main`. Railway rebuilds from Dockerfile; `start:prod` executes:

```bash
drizzle-kit migrate && tsx src/index.ts
```

Expected pending migrations on current production (23 applied):

- `0023_v137_rc2_reconciliation_lifecycle` (if not yet applied)
- `0024_v137_rc3_pool_loan_linkage`
- `0025_v137_rc3_pool_allocations_backfill`
- `0026_v137_prod_schema_repair`

### 2. Pre-migration backup

```bash
pg_dump "$DATABASE_URL" --format=custom --file=wilms-pre-remediation-$(date +%Y%m%d).dump
```

### 3. Verify journal (optional local)

```bash
npm run verify:migrations
```

With `DATABASE_URL` set, also reports applied/pending counts and schema probe.

### 4. Confirm health

```bash
curl -fsS https://wilms-production.up.railway.app/health | jq '
  .data.status,
  .data.migrations,
  .data.schema,
  .data.integrations
'
```

**Pass criteria:**

```json
"status": "ok"
"migrations": { "applied": 27, "expected": 27, "status": "ok" }
"schema": { "status": "ok", "missingTables": [] }
```

### 5. Production smoke (real credentials)

```bash
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
WILMS_SMOKE_EMAIL=<super-admin@your-org> \
WILMS_SMOKE_PASSWORD=<secret> \
npm run smoke:production -w @wilms/api
```

### 6. RBAC smoke (real credentials per role)

```bash
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_SMOKE_EMAIL=<admin> \
WILMS_SMOKE_PASSWORD=<secret> \
WILMS_SMOKE_COLLECTOR_EMAIL=<collector> \
WILMS_SMOKE_COLLECTOR_PASSWORD=<secret> \
WILMS_SMOKE_OFFICER_EMAIL=<officer> \
WILMS_SMOKE_OFFICER_PASSWORD=<secret> \
npm run smoke:rbac -w @wilms/api
```

### 7. Financial verification (requires DATABASE_URL)

```bash
npm run cert:financial:prep -w @wilms/api   # optional seed reset
npm run verify:financial -w @wilms/api
```

### 8. Re-run certification sprint

Update reports in `docs/certification/v1.3.7/`. Only then:

```bash
git tag -a v1.3.7-production-certified -m "WILMS v1.3.7 production certified"
git push origin v1.3.7-production-certified
```

---

## Health endpoint additions

`/health` now reports (informational, non-degrading):

- `integrations.mail` / `integrations.sms` — configured status
- `integrations.notifications` — in-app available; email/SMS optional
- `workers` — `redis: not_used`, `queue: in_process`, `scheduler: http_triggered`

Redis is not used in WILMS v1.3.7. Background work runs in-process; communication scheduler is HTTP-triggered.

---

## Blocked without operator access

- Neon backup restore drill
- Lighthouse / browser / mobile manual testing
- WCAG axe full audit
- Financial live reconciliation without `DATABASE_URL`

Document results honestly in certification reports after each step.
