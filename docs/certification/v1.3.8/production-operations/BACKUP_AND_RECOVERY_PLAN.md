# Backup and Recovery Plan — WILMS v1.3.8

**Version:** 1.3.8  
**Last updated:** 2026-07-17

## 1. Scope

This plan covers backup, recovery objectives, and restore procedures for WILMS production data and configuration.

| Asset | Primary store | Backup mechanism |
|-------|---------------|------------------|
| Transactional data | Neon PostgreSQL | Neon managed backups + PITR |
| File uploads | Cloudinary | Cloudinary retention / plan backups |
| Application code | GitHub | Tags (`v1.3.8`), `main` branch |
| Secrets / config | Railway, Vercel, GitHub | Manual export to secure vault |
| Audit compliance | PostgreSQL + exports | Immutable audit log in DB |

## 2. Recovery objectives (targets)

These are **recommended organizational targets**, not measured production SLAs unless your contract states otherwise.

| Tier | RTO (recovery time) | RPO (data loss) | Scenario |
|------|---------------------|-----------------|----------|
| API service | 1–4 hours | 0 (stateless redeploy) | Railway redeploy or rollback |
| Frontend | &lt; 30 minutes | 0 | Vercel instant rollback |
| Database (PITR) | 2–4 hours | ≤ 15 minutes | Neon point-in-time branch |
| Cloudinary assets | 4–24 hours | Depends on plan | Provider restore |
| Full site disaster | 4–8 hours | ≤ 15 minutes | Combined PITR + redeploy |

## 3. Neon PostgreSQL

### 3.1 Managed backups

- Enable **Point-in-Time Recovery (PITR)** on the Neon production project.
- **Retention:** Minimum 7 days recommended; align with organizational policy and regulatory needs.
- Connection via `DATABASE_URL` in Railway (rotate on branch swap).

### 3.2 Pre-migration backup (mandatory)

Before every production migration:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=wilms-pre-migrate-$(date +%Y%m%d-%H%M).dump
```

Store dump in encrypted object storage with retention matching policy.

### 3.3 Post-migration verification

```bash
npm run db:migrate -w @wilms/api
curl -fsS "${WILMS_API_URL}/health" | jq '.data.migrations, .data.schema'
```

v1.3.8 expects **28 migrations** through `0027_hot_query_indexes`. Health uses Drizzle watermark — `migrations.status: ok` when latest journal `when` is applied.

```bash
npm run verify:migrations -w @wilms/api
```

### 3.4 PITR restore procedure

1. **Identify recovery point** — timestamp before incident (UTC).
2. **Create PITR branch** — Neon Console → Branches → Create from point in time.
3. **Validate branch** (read-only):
   - Connect with branch `DATABASE_URL`
   - `npm run verify:migrations -w @wilms/api`
   - Spot-check: pool balances, recent payments, audit log continuity
4. **Cutover:**
   - Maintenance window: stop or read-only API (coordinate writes)
   - Update Railway `DATABASE_URL` to restored branch (or promote per Neon docs)
   - Redeploy API; verify `/health`
5. **Application validation:**
   - `smoke:production`, `smoke:rbac`
   - Super Admin financial reports vs last known export
6. **Document** recovery point, data loss window, and sign-off.

### 3.5 Logical restore from `pg_dump`

For migration to new Neon project or cross-region copy:

```bash
pg_restore --dbname="$TARGET_DATABASE_URL" --clean --if-exists wilms-pre-migrate-YYYYMMDD.dump
npm run db:migrate -w @wilms/api
```

## 4. Cloudinary (uploads)

Production uses `UPLOAD_PROVIDER=cloudinary`.

- Borrower photos, ID documents, signatures are **not** in PostgreSQL.
- Recovery requires Cloudinary asset retention and API access.
- Enable backup / multi-region features if available on your plan.
- After DB PITR, verify upload metadata URLs still resolve (IDs stored in DB).

## 5. Application configuration backup

| Store | Contents | Backup method |
|-------|----------|---------------|
| Railway env | API secrets, `DATABASE_URL`, SMS, mail | Railway export / secret manager |
| Vercel env | BFF, `NEXT_PUBLIC_*`, Gmail relay | Vercel env export |
| GitHub secrets | Deploy workflow credentials | Document in vault; rotate on staff change |
| Git repository | Code, migrations, docs | `git tag v1.3.8`; GitHub redundancy |

**Quarterly:** Export env snapshots to encrypted storage; verify restore drill calendar.

## 6. Release artifacts

```bash
git tag -a v1.3.8 -m "WILMS v1.3.8"
git push origin v1.3.8
```

Retain release notes and certification reports under `docs/certification/v1.3.8/` for audit traceability.

## 7. Recovery scenarios

| Scenario | Procedure | RTO |
|----------|-----------|-----|
| API container crash | Railway auto-restart (`restartPolicyType: on_failure`) | Minutes |
| Bad API deploy | Railway rollback; see [ROLLBACK_RUNBOOK.md](./ROLLBACK_RUNBOOK.md) | 15–60 min |
| Bad frontend deploy | Vercel instant rollback | &lt; 30 min |
| Bad migration | PITR branch; redeploy previous API | 2–4 h |
| Accidental data delete | PITR to pre-delete timestamp | 2–4 h |
| Neon region outage | Failover per Neon plan; restore dump to new project | 4–8 h |
| Cloudinary outage | New uploads fail; reads may work from cache; wait or failover provider | Variable |
| Secrets compromise | Rotate all secrets; force session invalidation via `session_version` | 1–2 h |

## 8. Ops dashboard backup signal

`GET /api/v1/ops/status` reports:

```json
{
  "backups": {
    "status": "external_managed",
    "provider": "neon",
    "detail": "Point-in-time recovery and snapshots are managed in Neon..."
  }
}
```

This is **informational** — confirm PITR in Neon Console; API does not probe backup success.

## 9. Testing schedule

| Test | Frequency | Owner |
|------|-----------|-------|
| PITR branch restore to staging | Quarterly | DBA / SRE |
| `pg_dump` restore drill | Semi-annual | DBA |
| Full recovery tabletop | Annual | Engineering + ops |
| Post-deploy health + smoke | Every release | Deploy workflow |

Automated restore drill scripting is recommended for v1.4 ([LONG_TERM_MAINTENANCE_PLAN.md](./LONG_TERM_MAINTENANCE_PLAN.md)).

## 10. Related docs

- [ROLLBACK_RUNBOOK.md](./ROLLBACK_RUNBOOK.md)
- [INCIDENT_RESPONSE_PLAYBOOK.md](./INCIDENT_RESPONSE_PLAYBOOK.md) § Database
- [docs/operations/backups.md](../../../operations/backups.md)
