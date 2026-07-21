# Database Audit — Phase 26 (v1.4.1)

**Date:** 2026-07-21  
**Migrations:** Journal integrity **PASS** through `0028_v140_platform_foundation`  
**Live DB reconcile:** **Not verified** in this pack (`DATABASE_URL` unset locally)

---

## Migration gate (Verified)

```
npm run verify:migrations → Journal integrity: PASS
(entries 0018…0028 including 0028_v140_platform_foundation)
Database: skipped when DATABASE_URL not set
```

No new migration required for Phase 26 remediations (application-layer controls).

---

## Data-path improvements (Verified)

| Topic | Status | Evidence |
|-------|--------|----------|
| Payment by primary key | `findPaymentById` used by `getPaymentById` | Avoids list-cap false misses |
| Pool aggregates after adjustment approve | `poolRepo.refreshPoolAggregates` in approve path | Prevents stale utilisation |
| Invitation timestamps | `invitedAt` set on invite + resend | Expiry window is data-backed |
| Idempotency records | Existing idempotency store; `LOAN_CREATE` scoped | Duplicate create protection |

---

## Carry-forward schema posture

| Item | Status |
|------|--------|
| `domain_outbox` (0028) | Present — Phase 25 |
| Hot query indexes (0027) | Present |
| Pool / loan linkage + allocations backfill | Present (00124–0025 lineage) |
| Immutable audit log | Design unchanged — no delete path introduced |
| In-memory store without `DATABASE_URL` | Dev/demo only — **not** production |

---

## Residuals / operator

| ID | Finding | Action |
|----|---------|--------|
| P26-DB-01 | No Neon/PITR restore drill evidence attached here | Operator — backup drill + measured RTO |
| P26-DB-02 | Report queries still application-list based | Engineering backlog — SQL aggregations |
| P26-DB-03 | Production `DATABASE_URL` / migration apply on deploy | Operator — confirm `/health` migrations healthy |

---

## Explicit non-claims

- No claim of live production schema drift check.  
- No claim of restore-drill PASSED without operator evidence file.

**Verdict context:** READY WITH CONDITIONS — Production Certified **NOT ISSUED**.
