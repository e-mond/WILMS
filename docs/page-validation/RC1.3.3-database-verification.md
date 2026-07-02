# RC1.3.3 — Database Verification

- Migrations expected: **11** (`0000`–`0010`)
- Production `/health`: `applied: 11`, `status: ok`
- New probe: `/health.schema.missingTables` — lists absent core tables
- `npm run verify:empty-db` — runs all list handlers against `DATABASE_URL` (users-only DB)

**Requirement:** After `db:migrate`, no financial seed required. Only reference seed for auth (`db:seed:reference`).
