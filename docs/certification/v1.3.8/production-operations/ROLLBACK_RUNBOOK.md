# Rollback Runbook — WILMS v1.3.8

**Version:** 1.3.8  
**Last updated:** 2026-07-17

## 1. Principles

| Principle | Detail |
|-----------|--------|
| **Frontend first for UX** | Vercel instant rollback is fastest when UI or BFF proxy regresses |
| **API second** | Railway rollback when business logic or auth breaks |
| **Database last** | Never roll back migrations in place without DBA review; prefer Neon PITR |
| **No blue/green native** | v1.3.8 uses platform rollback (Vercel + Railway previous deploy) |

## 2. Decision matrix

| Symptom | Likely layer | First action |
|---------|--------------|--------------|
| UI broken, API healthy | Frontend | Vercel rollback |
| 5xx on API, `/health` degraded | API or DB | Check `/health`; rollback API or restore DB |
| Login/CSRF failures | Frontend BFF | Vercel rollback; verify `WILMS_API_UPSTREAM` |
| Migration applied, app errors | Database | PITR branch restore; hold API at previous version |
| Email/SMS only | Integration | Config fix; rollback usually unnecessary |
| Financial calculation wrong | API + data | Stop writes; incident playbook; targeted fix or PITR |

## 3. Frontend rollback (Vercel)

**RTO target:** minutes (platform instant rollback).

### Steps

1. Vercel Dashboard → Project → **Deployments**
2. Find last known good production deployment
3. **⋯** → **Promote to Production** (or Instant Rollback)
4. Verify:
   ```bash
   curl -fsS -o /dev/null -w "%{http_code}\n" https://wilms.vercel.app/login
   ```
5. Hard-refresh / PWA reinstall for field users if service worker cached bad assets

### CLI alternative

```bash
vercel rollback
# or redeploy prior commit:
git checkout <good-sha>
vercel deploy --prod --yes
```

### Config rollback

If rollback involves env changes, restore Vercel env from exported snapshot:

- `WILMS_API_UPSTREAM`
- `NEXT_PUBLIC_USE_MOCK=false`
- Gmail relay secrets

## 4. API rollback (Railway)

**RTO target:** 15–60 minutes (redeploy + health verification).

### Dashboard

1. Railway → Service → **Deployments**
2. Select previous successful deployment → **Rollback**

### CLI / git tag

```bash
git checkout v1.3.7   # or known-good SHA
railway up --detach
curl -fsS https://wilms-production.up.railway.app/health
```

Expect `version` matching rolled-back release and `status: ok`.

### After API rollback

```bash
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
npm run smoke:production -w @wilms/api
```

**Note:** If frontend was deployed for v1.3.8 API contract changes, roll back frontend to matching version.

## 5. Database rollback

**RTO target:** 1–4 hours (depends on Neon branch swap and validation).  
**RPO target:** ≤ 15 minutes with Neon PITR (organizational target, not measured SLA).

### 5.1 When to use PITR

- Bad migration corrupted data or schema
- Accidental mass delete/update
- Financial integrity breach requiring point-in-time restore

### 5.2 When NOT to roll back migrations in place

Drizzle migrations are forward-only. Running down migrations on production is unsupported. Use Neon PITR to a branch at pre-change timestamp.

### 5.3 PITR procedure (summary)

Full detail: [BACKUP_AND_RECOVERY_PLAN.md](./BACKUP_AND_RECOVERY_PLAN.md).

1. **Stop writes** — maintenance mode or API scale-to-zero (coordinate with stakeholders).
2. Neon Console → **Branches** → **Create branch from point in time**
3. Choose timestamp **before** incident (allow 1–2 min buffer).
4. Validate branch:
   ```bash
   DATABASE_URL=<branch-url> npm run verify:migrations -w @wilms/api
   # Spot-check financial totals vs last known good export
   ```
5. Swap `DATABASE_URL` in Railway to branch connection string (or promote branch to primary per Neon workflow).
6. Redeploy API if needed; run `db:migrate` only if schema drift exists on restored branch.
7. Full smoke + financial reconciliation before reopening.

### 5.4 Migration-only failure (no data corruption)

If migration failed mid-flight and DB is consistent:

1. Fix migration or apply hotfix migration on `main`
2. Re-run `npm run db:migrate -w @wilms/api`
3. Verify `/health` → `migrations.status: ok`

Do not rollback API for a fix-forward migration if data is intact.

## 6. Combined rollback sequence (P1 incident)

```
1. Announce incident channel
2. Vercel → rollback frontend (if user-facing)
3. Railway → rollback API (if /health degraded or 5xx)
4. If DB involved → Neon PITR (stop writes first)
5. smoke:production + smoke:rbac
6. Super Admin /ops — confirm surfaces green
7. Post-incident review
```

## 7. Rollback validation checklist

- [ ] `GET /health` → `status: ok`, correct `version`
- [ ] `npm run verify:version` passes
- [ ] `smoke:production` passes with production credentials
- [ ] `smoke:rbac` passes
- [ ] Super Admin `/ops` — no degraded critical surfaces
- [ ] Sample payment read-only check (no duplicate posts)
- [ ] Stakeholder sign-off to resume operations

## 8. Readiness guidance (not implemented)

For future releases, consider:

- **Canary:** Deploy API to staging with production-like data volume first
- **Feature flags (v1.4):** Disable new code paths without full rollback
- **Blue/green:** Second Railway service + traffic switch (manual today)

## 9. Related docs

- [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md)
- [BACKUP_AND_RECOVERY_PLAN.md](./BACKUP_AND_RECOVERY_PLAN.md)
- [INCIDENT_RESPONSE_PLAYBOOK.md](./INCIDENT_RESPONSE_PLAYBOOK.md)
