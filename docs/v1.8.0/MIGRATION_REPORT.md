# WILMS v1.8.0 — Migration Report

## Migrations

| Tag | Purpose |
|-----|---------|
| `0037_v180_ghana_holiday_provider` | Organisation holiday source/enabled/year/external_key for Ghana sync |
| `0038_v180_automation_engine` | `automation_rules`, `automation_runs`, `automation_tasks` |
| `0039_v180_holiday_request_enrichment` | Holiday request notes, evidence URL, community/group/borrower refs |

## Apply

`drizzle-kit` loads `DATABASE_URL` from the **repository root `.env`** (not `apps/frontend/.env.local`).

```bash
# set DATABASE_URL in root .env, then:
./scripts/apply-v180-migrations.sh
# or
npm run db:migrate -w @wilms/domain
```

## Verification

After migrate:

1. Confirm journal tags 0037–0039 applied in Neon `__drizzle_migrations`.
2. `POST /organization-holidays/sync-ghana` as admin.
3. `GET /automation/rules` as Super Admin (seeds defaults when empty).
4. Create a collector holiday request with notes/evidence fields.

## Rollback notes

SQL migrations are additive (`IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`). Rollback is restore-from-backup preferred for production Neon. Do not drop automation tables while scheduled jobs may write.

## Local residual

This developer environment may not have `DATABASE_URL` configured. Operator must apply migrations on staging/production Neon before enabling Ghana sync / automation tables in live traffic.
