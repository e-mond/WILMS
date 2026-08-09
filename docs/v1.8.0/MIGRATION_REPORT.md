# WILMS v1.8.0 — Migration Report

## Migrations

| Tag | Purpose |
|-----|---------|
| `0036_v175_holiday_requests` | Holiday request lifecycle table (prerequisite) |
| `0037_v180_ghana_holiday_provider` | Organisation holiday source/enabled/year/external_key for Ghana sync |
| `0038_v180_automation_engine` | `automation_rules`, `automation_runs`, `automation_tasks` |
| `0039_v180_holiday_request_enrichment` | Holiday request notes, evidence URL, community/group/borrower refs |

## Apply tooling

Preferred (works when `drizzle-kit migrate` cannot resolve `drizzle-orm` in this monorepo):

```bash
# Local / shared Neon (apps/backend/.env.local)
./scripts/apply-v180-migrations.sh apps/backend/.env.local

# Or explicit URL
DATABASE_URL='postgresql://…' node scripts/apply-pending-migrations.mjs
```

CI workflow (after merge to default branch): `.github/workflows/apply-database-migrations.yml`

## Applied status (2026-08-09)

| Target | Host | Result |
|--------|------|--------|
| Local (`apps/backend/.env.local`) | `ep-noisy-river-atkdh45c-pooler…neon.tech` | **Applied** 0036–0039 (idempotent re-run skips all 40 journal entries) |
| Production (Vercel `wilms.vercel.app`) | Same Neon (health `latestJournalWhen=1785544800000` = 0039) | **Applied** via shared database |

Verification after apply:

- Tables present: `holiday_requests`, `automation_rules`, `automation_runs`, `automation_tasks`
- Columns present: Ghana holiday provider fields + holiday enrichment fields
- Production health: `schema.status=ok`, `missingTables=[]`

## Notes

- `drizzle.__drizzle_migrations` row count may show `applied=39` vs journal `expected=40` (historical off-by-one / `countGap`); latest journal `when` confirms 0039 is recorded.
- Legacy Railway API (`wilms-production.up.railway.app`) still reports older app version `1.4.2`; it was not redeployed in this step. If that service uses a different `DATABASE_URL`, run the Apply Database Migrations workflow (or Deploy Production migrate step) after the workflow file is on `main`.
- Do not commit `.env` / pulled Vercel env files.
