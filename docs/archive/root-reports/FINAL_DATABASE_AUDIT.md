# FINAL_DATABASE_AUDIT.md

**Release candidate:** v1.3.8  
**Date:** 2026-07-17

## Migration State

| Item | Local candidate | Production |
|---|---|---|
| Journal entries | 27 | expected 27 |
| Applied count | N/A (no local DB) | 26 |
| Watermark status | N/A | `ok` |
| Schema missing tables | N/A | `[]` |
| Latest SQL | `0026_v137_prod_schema_repair` | Present via watermark |

`verify:migrations` → **PASS** (journal/SQL parity)

## Notes on applied=26 vs expected=27

Drizzle migrates by watermark (`MAX(created_at)` / journal `when`), not row count. Historical gap can leave one journal row unrecorded while schema is complete. Health correctly reports `migrations.status=ok` when watermark caught up. Schema repair migration `0026` is idempotent.

## Indexes / Query Health

- List query indexes: migration `0021`
- N+1 risks remain possible in messaging thread summary loops (known pattern; acceptable at current scale)
- Full EXPLAIN analysis not run without DB

## Backup / DR

| Item | Status |
|---|---|
| Neon backups | External — operator must confirm PITR |
| Restore drill | Not executed in this sprint |
| Abandoned migrations | None found |

## Verdict

**Database gate: CONDITIONAL PASS** — production schema healthy; backup/restore remains operator evidence.
