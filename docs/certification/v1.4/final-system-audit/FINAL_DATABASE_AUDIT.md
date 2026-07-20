# Final Database Audit — WILMS v1.4.1

**Date:** 2026-07-20  
**ORM:** Drizzle (PostgreSQL)  
**Journal:** `apps/backend/src/db/migrations/meta/_journal.json`

---

## Summary

| Check | Result | Status |
|-------|--------|--------|
| Migration journal entries | **29** | **Verified** |
| Matching SQL files | **29** | **Verified** |
| Health on migration drift | Soft-fail / degrade (does not invent “ok”) | **Verified** in `health.service.ts` |
| Node runtime vs engines | Node **22** (CI + deploy workflows) | **Verified** |
| Staging deploy gate | `ENABLE_STAGING_DEPLOY == 'true'` | **Verified** |
| Production certificate | **NOT ISSUED** | Explicit |
| Live DB watermark / PITR drill | — | **Pending operator** |
| Live load / scale on DB | — | **Not verified** |

---

## Migrations

- Journal dialect: PostgreSQL.  
- Repo integrity: journal length matches SQL migration count (**29**).  
- Runtime health compares journal watermark vs `drizzle.__drizzle_migrations` applied watermark; historical count gaps may exist while watermark is current — health treats true behind-watermark as **degraded**.

Operators should confirm post-deploy:

1. `GET /health` shows DB connected and migrations not degraded.  
2. `latestJournalWhen` matches expected journal watermark for v1.4.1.  
3. Backup / PITR restore drill evidence attached (see [FINAL_MANUAL_ACTIONS_REQUIRED.md](./FINAL_MANUAL_ACTIONS_REQUIRED.md)).

---

## Schema / data safety notes

| Topic | Notes |
|-------|-------|
| In-memory mode | Used when `DATABASE_URL` unset — **not** production |
| Demo seed | `shouldSeedDemoUsers()` false in production runtime — **Verified** this branch |
| Idempotency / outbox tables | Phase 25 carry-forward — present when migrated |
| Pool allocations | Append-only ledger model — see [FINANCIAL_MODEL.md](../../../FINANCIAL_MODEL.md) |

---

## CI / deploy alignment

| Workflow | Node | Notes |
|----------|------|-------|
| `ci.yml` | 22 | Consistency check present |
| `deploy-staging.yml` | 22 | Gated by `ENABLE_STAGING_DEPLOY` |
| `deploy-production.yml` | 22 | Aligned with root `engines.node >=22` |

This branch fixed prior Node 20 drift on deploy workflows — **Verified**.

---

## Explicit non-claims

- No live production migration watermark captured in this pack.  
- No backup restore RTO measured here.  
- No Production Certified database seal.
