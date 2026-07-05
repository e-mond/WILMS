# RC1.3.3 ÔÇö Database Verification

- Migrations expected: **11** (`0000`ÔÇô`0010`)
- Production `/health`: `applied: 11`, `status: ok`
- New probe: `/health.schema.missingTables` ÔÇö lists absent core tables
- `npm run verify:empty-db` ÔÇö runs all list handlers against `DATABASE_URL` (users-only DB)

**Requirement:** After `db:migrate`, no financial seed required. Only reference seed for auth (`db:seed:reference`).
