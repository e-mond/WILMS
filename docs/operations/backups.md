# WILMS Backup & Recovery

**Version:** v1.3.8  
**Last updated:** 2026-07-17

> **Full plan:** [BACKUP_AND_RECOVERY_PLAN.md](../certification/v1.3.8/production-operations/BACKUP_AND_RECOVERY_PLAN.md)  
> **Rollback:** [ROLLBACK_RUNBOOK.md](../certification/v1.3.8/production-operations/ROLLBACK_RUNBOOK.md)

## Database (Neon PostgreSQL)

WILMS production data lives in Neon PostgreSQL, managed through Railway environment configuration.

### Neon managed backups

- Enable **point-in-time recovery (PITR)** on the Neon project (recommended for production).
- Retention: align with organizational policy (minimum 7 days recommended).
- **RPO target:** ≤ 15 minutes with PITR (organizational target, not measured SLA).
- Verify restore procedure quarterly on a branch database.

### Manual export (pre-migration)

Before applying migrations in production:

```bash
# Using Neon console or pg_dump with DATABASE_URL from Railway secrets
pg_dump "$DATABASE_URL" --format=custom --file=wilms-pre-migrate-$(date +%Y%m%d).dump
```

### Post-migration verification

```bash
npm run db:migrate -w @wilms/api
curl -fsS "${WILMS_API_URL}/health" | jq '.data.migrations'
```

Confirm `migrations.status: ok` (Drizzle watermark current). v1.3.8 journal has **28 entries** through `0027_hot_query_indexes`:

```bash
npm run verify:migrations -w @wilms/api
# apps/backend/src/db/migrations/meta/_journal.json
```

## File uploads (Cloudinary)

- Production uploads use Cloudinary (`UPLOAD_PROVIDER=cloudinary`).
- Enable Cloudinary backup / multi-region if available on your plan.
- Borrower photos, ID documents, and signatures are not stored in PostgreSQL — recovery requires Cloudinary asset retention.

## Application configuration

| Store | Contents | Backup method |
|-------|----------|---------------|
| Railway env | API secrets, `DATABASE_URL`, SMS, mail | Railway env export / secret manager |
| Vercel env | BFF proxy, `NEXT_PUBLIC_*`, mail relay | Vercel project env export |
| Git repository | Code, migrations, docs | GitHub (tag releases e.g. `v1.3.8`) |

## Release artifacts

Tag each production release:

```bash
git tag -a v1.3.8 -m "WILMS v1.3.8"
git push origin v1.3.8
```

Retain release notes and certification reports under `docs/certification/v1.3.8/` for compliance traceability.

## Recovery runbook (summary)

| Scenario | Action | RTO target |
|----------|--------|------------|
| API down | Redeploy from last good tag via Railway; verify `/health` | 1–4 h |
| Bad migration | Neon PITR branch to pre-migration point; redeploy previous API | 2–4 h |
| Frontend regression | Vercel instant rollback | &lt; 30 min |
| Data corruption | Neon PITR restore; `db:migrate` only if schema drift | 2–4 h |

Ops dashboard (`/ops`) reports `backups.status: external_managed` (Neon) — confirm PITR in Neon Console.

See [production-runbook.md](./production-runbook.md) and the [full backup plan](../certification/v1.3.8/production-operations/BACKUP_AND_RECOVERY_PLAN.md) for step-by-step procedures.
