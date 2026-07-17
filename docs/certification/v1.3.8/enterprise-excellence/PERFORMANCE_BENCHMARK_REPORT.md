# Performance Benchmark Report

**Date:** 17 July 2026  
**Environment:** Analysis + unit tests (no production load generator in this sprint)

## Before → after (dashboard money path)

| Metric | Before | After |
|---|---|---|
| Payments for KPI total | `listPayments` ≤2000 rows in Node | `SUM(amount)` SQL |
| Collector actuals | Reduce full payment list | `GROUP BY collector` SQL |
| Collector expected | N collectors × 3 queries | 1 grouped SQL |
| Double fetch | summary + overview both listed payments | overview aggregates; summary skips payment list when DB on |

## Expected impact

| Scale | Benefit |
|---|---|
| <5k payments | Modest latency win; correctness vs silent cap |
| 10k–100k | Material — avoids wrong KPIs + API CPU |
| 1M+ | Still need materialized views / replicas |

## Not benchmarked here

- Frontend LCP/INP
- Bundle size deltas
- Neon EXPLAIN after 0027

Recommend staging soak: 50 concurrent collectors posting + dashboard poll, compare p95 `/dashboard/summary`.
