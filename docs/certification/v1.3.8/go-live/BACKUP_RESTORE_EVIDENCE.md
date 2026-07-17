# Backup & Restore Evidence — WILMS v1.3.8

**Date:** 17 July 2026  
**Database provider:** Neon (inferred from project docs; not verified via console this session)

---

## Summary

| Item | Status |
|------|--------|
| Production database connected | **PASS** (health evidence) |
| Pre-migration `pg_dump` | **Pending** |
| Neon PITR enabled | **Pending** |
| Restore drill executed | **Pending** |
| RTO measured | **Pending** |
| RPO documented | **Pending** (no backup schedule evidence) |

**No backup or restore evidence was captured in Phase 22.** All recovery posture items below are marked **Pending** unless supported by on-disk artifacts.

---

## What we know (production health)

From `evidence/prod-health-20260717T170225Z.json`:

| Field | Value |
|-------|-------|
| `database.configured` | `true` |
| `database.connected` | `true` |
| `database.status` | `connected` |

This confirms the API can reach the production database. It does **not** confirm backup retention, PITR windows, or restore procedures.

---

## Agent environment constraints

| Variable | Status | Impact |
|----------|--------|--------|
| `DATABASE_URL` | **UNSET** | Cannot run `pg_dump`, restore test, or index verification queries |
| `NEON_API_KEY` | **UNSET** | Cannot query Neon API for branch/PITR status |

---

## Expected backup posture (reference only)

Per `docs/certification/v1.3.8/production-operations/BACKUP_AND_RECOVERY_PLAN.md`:

- Neon automated backups / PITR (operator must confirm in console)
- Pre-migration manual snapshot before schema changes
- Documented RTO/RPO targets for operational lending platform (not banking-grade DR)

**These are planning documents, not Phase 22 execution evidence.**

---

## Evidence required to close

| # | Evidence | Owner | Status |
|---|----------|-------|--------|
| 1 | Neon console screenshot: PITR enabled + retention period | DBA / Ops | **Pending** |
| 2 | `pg_dump` or Neon snapshot ID before `0027` migration | DBA / Ops | **Pending** |
| 3 | Restore drill log: branch restore or PITR point-in-time test | DBA / Ops | **Pending** |
| 4 | Measured RTO (restore start → `/health` ok) | SRE | **Pending** |
| 5 | Post-restore migration watermark check | SRE | **Pending** |

---

## Migration `0027` backup note

Migration `0027_hot_query_indexes` adds indexes only (no destructive DDL). Risk is lower than data migrations, but **backup evidence is still required** for operator closure per [OPERATOR_CLOSURE_CHECKLIST.md](./OPERATOR_CLOSURE_CHECKLIST.md).

Production watermark confirms `0027` applied (`latestJournalWhen: 1784296800000`). No pre-migrate dump timestamp is on record.

---

## Rollback reference

| Scenario | Evidence | Status |
|----------|----------|--------|
| Index rollback (drop indexes) | Runbook exists | Documented — not executed |
| Full DB restore from backup | Restore drill | **Pending** |
| Application rollback (Railway/Vercel) | Deploy history | **Pending** — not captured |

Reference: `docs/certification/v1.3.8/production-operations/ROLLBACK_RUNBOOK.md`

---

## Verdict

**Backup & restore: Pending operator evidence.**

This gap does **not** invalidate software readiness (product is live and schema-ok), but it **blocks** upgrading certification from **⚠ READY WITH CONDITIONS** to **✅ READY FOR PRODUCTION**.

Complete checklist §4 in [OPERATOR_CLOSURE_CHECKLIST.md](./OPERATOR_CLOSURE_CHECKLIST.md).
