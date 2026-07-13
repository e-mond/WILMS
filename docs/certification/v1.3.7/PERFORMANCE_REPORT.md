# Performance Report — v1.3.7

**Date:** 2026-07-13  
**Verdict:** **BUNDLE PASS — LIGHTHOUSE NOT RUN**

---

## Bundle budget (executed)

| Metric | Value | Budget | Status |
|--------|-------|--------|--------|
| JS total (gzip) | **168.4 KB** | 350 KB | PASS |
| CSS total (gzip) | **9.4 KB** | 100 KB | PASS |

Commands: `npm run bundle:budget-check`, `npm run perf:budget-check` — exit 0.

---

## Production build

| Metric | Value |
|--------|-------|
| Build | PASS (~24s) |
| Shared First Load JS | 87.7 KB |
| Middleware | 30.5 KB |
| Login route | ~126 KB First Load |

---

## Core Web Vitals (production)

| Metric | Target | Measured | Status |
|--------|--------|----------|--------|
| LCP | < 2.5s | **NOT RUN** | BLOCKED |
| FID / INP | < 100ms | **NOT RUN** | BLOCKED |
| CLS | < 0.1 | **NOT RUN** | BLOCKED |

Lighthouse requires browser + production URL. `perf:budget-check` validates bundle size only per script design.

---

## Network / runtime

| Check | Status |
|-------|--------|
| BFF gzip JSON parsing | **FAIL** in smoke (401 — auth blocked) |
| Memory profiling | **NOT RUN** |
| API p95 latency | **NOT RUN** |

---

## v1.3.7 delta vs v1.3.5

| Change | Impact |
|--------|--------|
| Dashboard chart prefs (`localStorage`) | Negligible — client-only |
| Reconciliation summary widget | Small additional API call on Super Admin dashboard |
| Product tour (`framer-motion`) | Existing dependency; splash-only in prior release |

No bundle budget regression (168.4 KB vs 168.6 KB in v1.3.5 report).

---

## Verdict

**Performance acceptable** for bundle size and build metrics. **Production Core Web Vitals certification deferred** until Lighthouse run on https://wilms.vercel.app post-migration.
