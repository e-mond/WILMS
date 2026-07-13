# WILMS Backup & Recovery

**Version:** v1.3.5  
**Last updated:** 2026-07-12

## Database (Neon PostgreSQL)

WILMS production data lives in Neon PostgreSQL, managed through Railway environment configuration.

### Neon managed backups

- Enable **point-in-time recovery (PITR)** on the Neon project (recommended for production).
- Retention: align with organizational policy (minimum 7 days recommended).
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

Confirm `applied` equals `expected` (26 migrations through `0025_v137_rc3_pool_allocations_backfill` for v1.3.7).

## File uploads (Cloudinary)

- Production uploads use Cloudinary (`UPLOAD_PROVIDER=cloudinary`).
- Enable Cloudinary backup / multi-region if available on your plan.
- Borrower photos, ID documents, and signatures are not stored in PostgreSQL — recovery requires Cloudinary asset retention.

## Application configuration

| Store | Contents | Backup method |
|-------|----------|---------------|
| Railway env | API secrets, `DATABASE_URL`, SMS, mail | Railway env export / secret manager |
| Vercel env | BFF proxy, `NEXT_PUBLIC_*`, mail relay | Vercel project env export |
| Git repository | Code, migrations, docs | GitHub (tag releases e.g. `v1.3.5`) |

## Release artifacts

Tag each production release:

```bash
git tag -a v1.3.5 -m "WILMS v1.3.5"
git push origin v1.3.5
```

Retain `RELEASE_NOTES_v1.3.5.md` and audit reports in the repository for compliance traceability.

## Recovery runbook (summary)

1. **API down:** Redeploy from last known good tag via Railway; verify `/health`.
2. **Bad migration:** Restore Neon branch to pre-migration point; redeploy previous API image.
3. **Frontend regression:** Vercel instant rollback to previous deployment.
4. **Data corruption:** Restore Neon backup; run `npm run db:migrate` only if schema drift exists.

See [production-runbook.md](./production-runbook.md) for step-by-step deploy and rollback.
