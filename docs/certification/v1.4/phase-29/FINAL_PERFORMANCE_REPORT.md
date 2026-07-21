# Final Performance Report

**Version:** 1.4.2 | **Date:** 2026-07-21 | **Phase:** 29

## Frontend Bundle

| Metric | Value | Budget | Status |
|--------|-------|--------|--------|
| JS (gzip) | 168.4 KB | 350 KB | PASS |
| CSS (gzip) | 10.1 KB | 100 KB | PASS |
| First Load JS shared | 87.7 KB | — | Acceptable |
| Middleware | 30.5 KB | — | Acceptable |

Command: `npm run bundle:budget-check`

## Code Splitting

Next.js App Router with per-route dynamic chunks. 57 app routes built successfully.

## Backend SQL Performance

| Area | Classification |
|------|----------------|
| Financial aggregates | **Fixed** — SQL SUM/COUNT |
| Defaulter report | **Fixed** — CTE aggregation |
| Global search | **Accepted** — capped 8 results (non-financial) |
| Cursor pagination | **Implemented** — borrowers keyset API |

## Scale Testing

| Volume | Status |
|--------|--------|
| 1,000 borrowers | Not load-tested in this environment |
| 10,000 borrowers | **BLOCKED** — requires staging k6 |
| 100,000 borrowers | **BLOCKED** — infrastructure-dependent |

## Concurrency

In-memory concurrency tests pass. Multi-instance queue safety requires Redis (`REDIS_URL`).

## Load Test Gate

**BLOCKED** — operator must run k6 against staging. Target: 50 VU collectors, 10 VU reports, p95 < 2s.

## Status

**PASS (bundle + code-level SQL)** | Load test **BLOCKED**
