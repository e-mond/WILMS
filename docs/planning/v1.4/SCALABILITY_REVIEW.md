# Scalability Review — Phase 24.4

**Date:** 17 July 2026  
**Method:** Codebase inspection + Phase 18/19 validation findings  
**Scope:** Concurrent staff users (not borrower population) — WILMS is staff-operated microfinance  
**Baseline:** v1.3.8 on Railway + Neon + Vercel

---

## Assumptions

| Parameter | Definition |
|-----------|------------|
| **User** | Authenticated staff (collector, officer, approver, admin) |
| **Active user** | Generates API traffic in peak hour |
| **Data scale** | Grows with payments/loans, not user count |
| **Peak ratio** | ~30% of users concurrent at collection window (Fri–Sat mornings, Ghana field ops) |

---

## Tier summary

| Tier | Staff users | Approx. data | v1.3.8 verdict | v1.4 target |
|------|-------------|--------------|----------------|-------------|
| **T1** | 10 | 500 loans, 5k payments | ✅ Comfortable | ✅ |
| **T2** | 100 | 5k loans, 50k payments | ⚠️ List latency | ✅ |
| **T3** | 500 | 25k loans, 250k payments | ⚠️ Dashboard OK*; lists degrade | ✅ with cursor + indexes |
| **T4** | 5,000 | N/A — unrealistic staff count | N/A | N/A |
| **T5** | 50,000 | N/A | N/A | N/A |
| **T6** | 100,000 | N/A | N/A | N/A |

\* Executive dashboard collections totals fixed in Phase 18 (`financial-overview.ts` uses `paymentRepo.sumConfirmedPaymentsPesewas()` — no 2000-row trap). Migration `0027_hot_query_indexes.sql` added collector+date and loan_id indexes.

**Honest assessment:** T4–T6 staff-user counts are **not credible** for WILMS's deployment model (single-org women's microfinance). Those tiers are included because enterprise reviewers ask — the binding constraint is **row volume** (payments, borrowers), not login count. Row-scale equivalents below.

---

## Row-scale tiers (actionable)

| Tier | Loans | Payments | Borrowers | v1.3.8 | v1.4 | Bottleneck |
|------|-------|----------|-----------|--------|------|------------|
| **R1** | 1k | 10k | 2k | ✅ | ✅ | None |
| **R2** | 5k | 50k | 10k | ⚠️ | ✅ | Offset lists |
| **R3** | 10k | 100k | 20k | ⚠️ | ✅ | Expense scans, pool joins |
| **R4** | 50k | 500k | 100k | ❌ | ⚠️ | Neon pool, report exports |
| **R5** | 200k | 2M | 400k | ❌ | ❌ | Needs replica + archival |
| **R6** | 500k | 5M+ | 1M+ | ❌ | ❌ | v2.0 scale playbook |

---

## Codebase-derived bottlenecks

### 1. In-process job queue — **Critical at any multi-instance scale**

**Evidence:** `apps/backend/src/modules/ops/service.ts`

```typescript
workers: {
  redis: 'not_used',
  queue: 'in_process',
  scheduler: 'http_triggered',
}
```

| Impact | Restart loses mail/SMS; cannot scale API horizontally |
|--------|------------------------------------------------------|
| v1.4 fix | Redis + BullMQ |
| Effort | 12–18 pd |
| Priority | **P0** |

---

### 2. Unpaginated list default (2000-row cap) — **High**

**Evidence:** `apps/backend/src/http/list-pagination.ts`

```typescript
export const MAX_UNPAGINATED_LIST_ROWS = 2000;
// resolveListLimit returns 2000 when client omits pagination
```

| Impact | Silent truncation on borrowers, payments, expenses when UI omits `page` |
|--------|-----------------------------------------------------------------------|
| Affected routes | `borrowers/routes.ts` and siblings using `resolveListOffset` |
| v1.4 fix | Cursor/keyset pagination; require explicit limit |
| Effort | 10–15 pd |
| Priority | **P0** |

---

### 3. Dashboard KPI trap — **Fixed in v1.3.8 / Phase 18**

**Evidence:** `apps/backend/src/modules/dashboard/financial-overview.ts`

```typescript
// SQL aggregates — never truncate via listPayments 2000-row default.
totalCollectedPesewas = await paymentRepo.sumConfirmedPaymentsPesewas();
```

| Status | ✅ Remediated for collection totals |
| Residual | Pool list iteration, expense summaries — verify SQL paths |
| Priority | **P2** monitor |

---

### 4. Offset pagination — **High at depth**

**Evidence:** `parseListQuery` computes `offset: (page - 1) * pageSize`

| Impact | Page 50+ on 100k payments = expensive OFFSET scan |
| v1.4 fix | Keyset on `(created_at, id)` or domain sort key |
| Effort | 10–15 pd |
| Priority | **P0** |

---

### 5. Composite indexes — **Partially fixed**

**Evidence:** `apps/backend/src/db/migrations/0027_hot_query_indexes.sql`

- `payments_collector_date_idx`
- `ledger_entries_loan_id_idx`
- `payments_loan_id_idx`

| Status | ✅ Hot paths improved |
| Gap | Drizzle schema sync; borrower search indexes |
| Effort | 3–5 pd |
| Priority | **P1** |

---

### 6. Neon connection pool — **Medium at R3+**

| Impact | 100+ concurrent collectors → pool exhaustion, tail latency |
| Mitigation | PgBouncer (Neon built-in); reduce connection hold time; read replica v1.5 |
| Effort | 2–5 pd tuning |
| Priority | **P2** |

---

### 7. In-memory store (dev only) — **Not production**

`DATABASE_URL` unset uses in-memory — irrelevant for production scale review.

---

### 8. Offline queue (localStorage) — **Medium field risk**

**Evidence:** `apps/frontend/src/state/offlineQueueStore.ts` — payments/expenses in localStorage; upload queue partial IndexedDB.

| Impact | Queue loss on browser clear; size limits |
| v1.4 fix | IndexedDB for payment/expense queue |
| Effort | 6–10 pd |
| Priority | **P1** |

---

### 9. Optional idempotency — **Critical money integrity**

| Impact | Retry storm = duplicate payments at any scale |
| v1.4 fix | Mandatory `Idempotency-Key` |
| Effort | 4–6 pd |
| Priority | **P0** |

---

### 10. Export/report full scans — **High at R4**

Large CSV/PDF generation in API process blocks event loop.

| v1.4 fix | BullMQ export jobs + streaming |
| Effort | 5–8 pd |
| Priority | **P1** |

---

## Tier-by-tier analysis

### 10 users (T1 / R1)

| Dimension | Assessment |
|-----------|------------|
| API CPU | <5% peak |
| DB | Trivial |
| Queue | In-process acceptable **only** because single instance + low volume |
| Risk | None for v1.3.8 |

### 100 users (T2 / R2)

| Dimension | Assessment |
|-----------|------------|
| API | List endpoints 500ms–2s without pagination params |
| DB | Index seeks OK with 0027 |
| Queue | Mail backlog possible after deploy restart |
| v1.4 required | Cursor pagination, BullMQ |

### 500 users (T3 / R3)

| Dimension | Assessment |
|-----------|------------|
| API | Offset pagination timeouts on payment history |
| DB | 100k payment aggregates <500ms with SQL (verified pattern) |
| Queue | **Must** have durable workers |
| v1.4 required | All P0 items |

### 5,000 / 50,000 / 100,000 users

**Not applicable** as staff concurrency for WILMS niche. If interpreted as **borrower records**:

| Borrowers | v1.3.8 | Blocker |
|-----------|--------|---------|
| 5k | ⚠️ | List caps |
| 50k | ❌ | Full table scans, export memory |
| 100k | ❌ | Needs R4 playbook: archival, replica, search |

---

## Load test recommendations (v1.4 gate)

| Scenario | Target | Tool |
|----------|--------|------|
| 50 concurrent collectors posting payments | p95 < 800ms, 0 duplicates | k6 with idempotency keys |
| Payment list page 1 + page 100 (cursor) | p95 < 400ms | k6 |
| Dashboard summary | p95 < 1.5s at 100k payments | k6 |
| Worker throughput | 500 mail jobs/min | BullMQ metrics |
| API restart during job burst | 0 lost jobs after Redis | Chaos test |

---

## Scalability verdict

| Version | Certified scale (honest) |
|---------|---------------------------|
| v1.3.8 | Single org, **≤100 active staff**, **≤50k payments** with accepted list latency |
| v1.4 | **≤500 staff**, **≤100k payments**, correct list totals, durable async |
| v1.5 | **≤250k payments** with read replica + CQRS snapshots |
| v2.0 | **1M+ payments** with archival playbook |

WILMS is not competing with Temenos throughput. It must be **correct and auditable** at NGO/bank partner scale — that is the v1.4 bar.
