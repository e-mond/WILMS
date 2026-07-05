# WILMS — Database Status Report

**Audit date:** 2026-07-04 · **Commit:** `487708b`

---

## Schema overview

| Item | Value | Evidence |
|------|-------|----------|
| Migration files | **13** SQL files (`0000`–`0012`) | `apps/backend/src/db/migrations/` |
| Production applied | **13 / 13** | `GET /health` → `migrations.status=ok` |
| Schema health | **ok** | `schema.missingTables=[]` |
| ORM | Drizzle | `apps/backend/src/db/schema/` |
| Provider | Neon PostgreSQL | Production `database.connected=true` |

### Migration sequence

1. `0000_init.sql` — core schema  
2. `0001_tired_sir_ram`, `0002_sad_bucky` — incremental  
3. `0003_loan_pools`  
4. `0004_financial_adjustments`, `0005_financial_reversals`, `0006_financial_reconciliations`  
5. `0007_offline_sync`  
6. `0008_admin_extensions`, `0009_settings_extensions`  
7. `0010_messages`  
8. `0011_rc14_registration_capture`  
9. `0012_ghana_locations`  

---

## Tables / indexes / constraints

| Area | Status |
|------|--------|
| Core financial tables | Present per schema-health probe |
| RBAC tables | `permissions`, `roles`, `user_roles`, `users` |
| Registration capture | Added in `0011` |
| Ghana locations | `regions`, `districts`, `cities` in `0012` |
| Triggers / views | **Not individually audited** — no explicit trigger inventory run |
| Indexes | Defined in migrations — **not diff-audited** this pass |

---

## Seed scripts

| Script | Command | Contents |
|--------|---------|----------|
| Reference seed | `npm run db:seed:reference -w @wilms/api` | RBAC permissions, 5 roles, demo users, 1 collector (`COL-001`), adjustment reason codes |
| Demo financial | `npm run db:seed:demo -w @wilms/api` | 4 demo borrowers, loans, payments, 3 loan pools |
| Ghana locations | `npm run seed:ghana-locations` | Region/district/city reference data |
| Full seed | `db:seed` | Reference + demo when non-prod or `ALLOW_DEMO_SEED=true` |

Demo financial rows use UUID prefixes `01930001-*` (borrowers), `01930002-*` (loans), `01930003-*` (pools). Cleanup script: `apps/backend/scripts/cleanup-demo-financial-data.mjs`.

---

## Production data policy (documented intent)

Production should contain:

- Authentication / reference users (seeded demo accounts for ops)
- RBAC reference data
- Ghana location reference data (if seeded)
- **No demo financial borrowers, loans, or collections**

---

## Verification results

### Production Neon (2026-07-04)

| Check | Result |
|-------|--------|
| Connection | **Connected** — `/health` |
| Migration parity | **13/13** |
| Row counts (borrowers, loans, groups) | **NOT VERIFIED** — automated count probe failed from audit environment (CSRF/session tooling). Manual SQL or authenticated API count required. |
| Demo UUID prefix scan | **NOT VERIFIED** on production |

### Local database (`verify:empty-db` against `.env` DATABASE_URL)

Run: `npm run verify:empty-db` → **10/10 handler checks PASS**

| Entity | Count reported | Implication |
|--------|----------------|-------------|
| Borrowers | **3** | **Not reference-only** on local DB |
| Active loans | 0 | OK |
| Loan portfolio | 0 | OK |
| Groups | **1** | Reference or demo group |
| Collectors | **1** | Expected from reference seed |
| Risk flags | 0 | OK |

**Conclusion:** Local `.env` database is **not empty** of business borrowers. Production state **cannot be confirmed empty** without direct Neon query or successful authenticated list count.

---

## Reference data

| Data | Seeded? | Production expected? |
|------|---------|---------------------|
| Permissions / roles | Yes (reference seed) | Yes |
| Demo users (`*@wilms.demo`) | Yes (reference seed) | Yes (smoke tests use these) |
| Adjustment reason codes | Yes | Yes |
| Ghana locations | Optional script | Recommended |
| Demo borrowers/loans | Demo seed only | **No** — remove with cleanup script if present |

---

## Recommendations

1. Run `cleanup-demo-financial-data.mjs --dry-run` against **production** Neon and document counts  
2. Add production data audit to CI (borrower count ≤ N, no `01930001-%` UUIDs)  
3. Document expected post-deploy seed steps in deployment runbook  
4. Verify messages threads when `EMPTY_DB_ADMIN_USER_ID` set (currently skipped in empty-db smoke)
