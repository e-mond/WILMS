# Performance Validation — WILMS v1.3.8 Go-Live

**Date:** 17 July 2026  
**Scope:** Public latency probes + local bundle budget gates  
**Load / scale certification:** **Not in scope** (no load test evidence)

---

## Summary

| Area | Result |
|------|--------|
| API `/health` latency (public) | **PASS** — ~0.31–0.34 s |
| Frontend `/login` latency (public) | **PASS** — ~0.11–0.16 s |
| CSRF endpoint latency | **PASS** — ~0.033 s |
| JS bundle budget | **PASS** — 168.4 KB gzip (budget 350 KB) |
| CSS bundle budget | **PASS** — 9.4 KB gzip (budget 100 KB) |
| Migration `0027` hot indexes (repo) | **Present** |
| Production index verification query | **Pending** |
| Load test (concurrent users / 100k rows) | **Pending** — out of scope |

---

## Public latency samples

**Source:** `evidence/latency-samples.csv`  
**Tool:** curl `time_total` (single-threaded, from agent egress)

### API — `GET /health` (Railway)

| Sample | HTTP | time_total (s) |
|--------|------|----------------|
| 1 | 200 | 0.323562 |
| 2 | 200 | 0.316720 |
| 3 | 200 | 0.344818 |
| 4 | 200 | 0.319808 |
| 5 | 200 | 0.314005 |

**Range:** 0.314–0.345 s  
**Assessment:** Acceptable for health probe over public internet (includes TLS + edge routing).

### Frontend — `GET /login` (Vercel)

| Sample | HTTP | time_total (s) |
|--------|------|----------------|
| 1 | 200 | 0.164327 |
| 2 | 200 | 0.110099 |
| 3 | 200 | 0.138924 |

**Range:** 0.110–0.164 s

### BFF — `GET /api/auth/csrf` (Vercel)

| Sample | HTTP | time_total (s) |
|--------|------|----------------|
| 1 | 200 | 0.033265 |

### Auth enforcement — `GET /ops/metrics` (anon)

| Sample | HTTP | time_total (s) |
|--------|------|----------------|
| 1 | 401 | 0.102655 |

**Note:** Latency samples are **not** a substitute for load testing. No concurrent-user or sustained-traffic evidence exists.

---

## Bundle budgets (local build)

**Source:** `evidence/local-gates.txt`  
**Command:** `npm run bundle:budget-check`

| Asset | Measured (gzip) | Budget | Result |
|-------|-----------------|--------|--------|
| JavaScript | 168.4 KB | 350 KB | **PASS** |
| CSS | 9.4 KB | 100 KB | **PASS** |

---

## Database performance (migration 0027)

### Repo evidence

Journal includes `0027_hot_query_indexes` with indexes on:

- `payments` (collector + date, loan_id)
- `ledger_entries` (loan_id)

Local `verify:migrations`: **PASS** (28/28 journal entries).

### Production evidence

| Check | Status |
|-------|--------|
| Watermark includes `0027` | **PASS** (`latestJournalWhen: 1784296800000`) |
| `EXPLAIN ANALYZE` on hot queries | **Pending** |
| `pg_indexes` confirmation | **Pending** (`DATABASE_URL` unset) |

---

## Runtime posture (production health)

| Field | Value | Performance note |
|-------|-------|------------------|
| `workers.queue` | `in_process` | Single-process; no horizontal queue scaling |
| `workers.redis` | `not_used` | No distributed cache |
| `uptimeSeconds` | 706 (at probe) | Recent deploy; no long-run stability probe this session |

Upstream long-run data: `docs/certification/v1.3.8/rc-validation/LONG_RUNNING_STABILITY_REPORT.md` (not re-executed in Phase 22).

---

## Explicitly not certified

| Claim | Status |
|-------|--------|
| 100k+ row query performance | **Not tested** |
| 1M+ transaction scale | **Not tested** |
| Concurrent collector field load | **Not tested** |
| Fortune-500 SLA | **Not claimed** |

---

## Pending performance closure items

| # | Item | Status |
|---|------|--------|
| 1 | Production `pg_indexes` for `0027` | **Pending** |
| 2 | Authenticated dashboard KPI timing | **Pending** |
| 3 | External uptime/latency monitoring config | **Pending** |
| 4 | Optional load test before scale-up | **Pending** (recommended, not blocker) |

---

## Verdict

**Bundle budgets and public probe latencies: PASS** for v1.3.8 go-live software gate.

**Scale and sustained-load performance: Pending / out of scope** — do not claim enterprise-scale certification without new evidence.
