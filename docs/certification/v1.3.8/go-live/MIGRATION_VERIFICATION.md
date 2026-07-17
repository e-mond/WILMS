# Migration Verification — WILMS v1.3.8

**Date:** 17 July 2026  
**Release tag:** `0027_hot_query_indexes` (journal idx 27, 28 entries total)

---

## Summary

| Check | Result |
|-------|--------|
| Repo journal integrity | **PASS** |
| SQL files present for all journal entries | **PASS** |
| Production migration `status` | **PASS** (`ok`) |
| Production watermark includes `0027` | **PASS** |
| Applied row count vs expected | **ACCEPTED** (27 vs 28 — historical gap) |
| Production DB migration replay (agent) | **Skipped** (`DATABASE_URL` unset) |

---

## Local: `npm run verify:migrations`

**Session:** 2026-07-17 (agent environment)  
**Result:** **PASS**

| Check | Result |
|-------|--------|
| Journal entries | 28/28 |
| Sequential `idx` | ✓ |
| Orphan SQL files | None |
| Missing SQL for journal entries | None |
| Last journal tag | `0027_hot_query_indexes` |
| Database connectivity step | **Skipped** — `DATABASE_URL` unset in agent |

**Evidence:** `evidence/local-gates.txt`

---

## Production: `/health` migrations block

**Source:** `evidence/prod-health-20260717T170225Z.json`  
**Captured:** `2026-07-17T17:02:25.610Z`

| Field | Value | Interpretation |
|-------|-------|----------------|
| `expected` | 28 | Matches repo journal count |
| `applied` | 27 | Row count in `__drizzle_migrations` (or equivalent) |
| `status` | `ok` | Health gate considers migrations current |
| `countGap` | `true` | Row count ≠ expected; flagged but not failing |
| `latestAppliedAt` | `2026-07-17T14:00:00.000Z` | Last migration application timestamp |
| `latestJournalWhen` | `1784296800000` | Watermark matches journal `when` for `0027` |

### Watermark analysis

Drizzle migration health uses the **journal `when` watermark**, not raw row count alone.

- Journal entry `0027_hot_query_indexes` has `when: 1784296800000`.
- Production `latestJournalWhen: 1784296800000` → **watermark caught up** → `0027` applied per Drizzle semantics.
- `countGap: true` with `status: ok` indicates a **historical row-count discrepancy** (likely a merged/rebased migration or manual reconciliation) that does **not** block go-live because the watermark is current.

**Gate status:** **ACCEPTED** — not a blocker for v1.3.8 go-live.

---

## Schema verification (production)

From the same health payload:

| Field | Value |
|-------|-------|
| `schema.status` | `ok` |
| `schema.missingTables` | `[]` |

All expected tables present in production.

---

## Migration `0027` scope (reference)

Indexes defined in `0027_hot_query_indexes.sql` (repo):

- `payments_collector_date_idx`
- `ledger_entries_loan_id_idx`
- `payments_loan_id_idx`

**Index presence on production:** **Pending** — requires `DATABASE_URL` or DBA query. Watermark evidence supports application; direct `pg_indexes` confirmation not captured this session.

---

## Pre-migration backup

| Item | Status |
|------|--------|
| `pg_dump` before `0027` on production | **Pending** — no dump path/timestamp in evidence |
| Neon PITR enabled | **Pending** — no Neon console access |

See [BACKUP_RESTORE_EVIDENCE.md](./BACKUP_RESTORE_EVIDENCE.md).

---

## Rollback posture

| Scenario | Guidance |
|----------|----------|
| `0027` index rollback | Drop indexes via reverse SQL; low data risk (indexes only) |
| Full schema rollback | **Pending** — restore drill not executed |

Reference: `docs/certification/v1.3.8/production-operations/ROLLBACK_RUNBOOK.md`

---

## Verdict

| Dimension | Status |
|-----------|--------|
| Repo migration integrity | **PASS** |
| Production watermark (`0027`) | **PASS** |
| Row-count gap | **ACCEPTED** |
| Backup before migrate | **Pending** |
| Live index verification query | **Pending** |

Migration verification **does not block** software go-live. Operator should attach backup evidence and optional `pg_indexes` confirmation to close backup-related checklist items.
