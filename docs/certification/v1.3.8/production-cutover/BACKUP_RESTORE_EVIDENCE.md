# Backup & Restore Evidence — WILMS v1.3.8 Production Cutover

**Date:** 17 July 2026  
**Phase:** 23  
**Database provider:** Neon (inferred from project docs; **not verified via console this session**)

---

## Summary

| Item | Status |
|------|--------|
| Production database connected | **Complete** (health evidence) |
| Pre-cutover `pg_dump` / snapshot ID | **Pending** |
| Neon PITR enabled | **Pending** |
| Automated backup timestamp recorded | **Pending** |
| Restore drill executed | **Pending** |
| RTO measured | **Pending** |
| Post-restore migration watermark check | **Pending** |
| RPO documented | **Pending** |

**No backup or restore drill evidence was captured in Phase 23.** Recovery posture items are **Pending** unless supported by on-disk artifacts.

---

## What we know (production health)

**Source:** `evidence/prod-health-20260717T193511Z.json`

| Field | Value |
|-------|-------|
| `database.configured` | `true` |
| `database.connected` | `true` |
| `database.status` | `connected` |
| `migrations.status` | `ok` |
| `migrations.latestJournalWhen` | `1784296800000` (`0027`) |

This confirms the API reaches the production database. It does **not** confirm backup retention, PITR windows, or restore procedures.

---

## Agent environment constraints

**Source:** `evidence/credential-audit-20260717T193511Z.txt`

| Variable | Status | Impact |
|----------|--------|--------|
| `DATABASE_URL` | **UNSET** | Cannot run `pg_dump`, restore test, or index verification |
| `NEON_API_KEY` | **UNSET** | Cannot query Neon API for branch/PITR status |

**Neon restore:** **NOT EXECUTED** (no console/API access).

---

## Expected backup posture (reference only)

Per `docs/certification/v1.3.8/production-operations/BACKUP_AND_RECOVERY_PLAN.md`:

- Neon automated backups / PITR (operator must confirm in console)
- Pre-migration manual snapshot before schema changes
- Documented RTO/RPO targets for operational lending platform

**Planning documents are not Phase 23 execution evidence.**

---

## Evidence required to close

| # | Evidence | Owner | Status |
|---|----------|-------|--------|
| 1 | Neon console screenshot: PITR enabled + retention period | DBA / Ops | **Pending** |
| 2 | Latest automated backup timestamp (console or API) | DBA / Ops | **Pending** |
| 3 | `pg_dump` or Neon snapshot ID before `0027` migration (if available) | DBA / Ops | **Pending** |
| 4 | Restore drill log: branch restore or PITR point-in-time test | DBA / Ops | **Pending** |
| 5 | Measured RTO (restore start → `GET /health` 200) | SRE | **Pending** |
| 6 | Post-restore `/health` → `migrations.status: ok`, watermark ≥ `0027` | SRE | **Pending** |
| 7 | Optional: `pg_indexes` confirm `0027` indexes on read-only connection | DBA | **Pending** |

---

## Migration `0027` note

Migration `0027_hot_query_indexes` adds indexes only (non-destructive DDL). Production watermark confirms `0027` applied. **Backup evidence is still required** for operator closure regardless of migration risk class.

| Field | Value |
|-------|-------|
| `migrations.expected` | `28` |
| `migrations.applied` | `27` |
| `migrations.countGap` | `true` (**ACCEPTED** — historical gap) |
| `migrations.latestAppliedAt` | `2026-07-17T14:00:00.000Z` |

---

## Rollback reference

| Scenario | Method | Evidence | Status |
|----------|--------|----------|--------|
| Application rollback | Redeploy prior Railway/Vercel build | Deploy log | **Pending** |
| Schema rollback | Forward-only migrations — restore from backup | Restore drill log | **Pending** |
| Data corruption | Neon PITR to point before incident | PITR restore log | **Pending** |

Reference: `docs/certification/v1.3.8/production-operations/ROLLBACK_RUNBOOK.md`

---

## Decision

Backup and restore track: **Pending**.

Production cutover remains **⚠ READY WITH CONDITIONS** until Neon PITR confirmation, restore drill, and RTO measurement are attached with timestamps.
