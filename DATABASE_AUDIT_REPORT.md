# Database Audit Report — v1.3.6-rc1

**Date:** 2026-07-12

---

## Migration inventory

| Source | Count |
|--------|-------|
| `apps/backend/src/db/migrations/meta/_journal.json` | **23** entries (0000–0022) |

## Production state (live evidence)

`GET https://wilms-production.up.railway.app/health` on 2026-07-12:

| Field | Value |
|-------|-------|
| `migrations.applied` | 22 |
| `migrations.expected` | 23 |
| `migrations.status` | degraded |
| `schema.missingTables` | `organization_holidays`, `loan_fee_charges`, `loan_penalty_rules` |

## Root cause

Migration **`0020_v130_field_operations`** not fully applied on production (creates missing tables). Migration **`0022_v135_notification_events`** not applied (22 vs 23 count).

## Required action

```bash
npm run db:migrate -w @wilms/api
```

Re-check: `curl https://wilms-production.up.railway.app/health` → `"status":"ok"`, `degradedReasons:[]`.

## Schema health probe

`apps/backend/src/db/schema-health.ts` verifies 17 core tables including extended field-ops tables from 0020. Degraded status is **correct** when tables are absent.

## Code changes

- Health report adds `degradedReasons` for operator clarity.
- No destructive schema changes in v1.3.6-rc1.

## Indexes / FKs

No changes. Migration `0021_list_query_indexes` is index-only (already in journal).
