# Performance Report — v1.3.5

**Date:** 2026-07-11  
**Version:** 1.3.5

---

## Bundle Budget

| Metric | Value | Budget | Status |
|--------|-------|--------|--------|
| JS total (gzip) | 168.6 KB | 350 KB | PASS |
| CSS total (gzip) | 9.0 KB | 100 KB | PASS |

Command: `npm run bundle:budget-check` — exit 0.

---

## Production Build

| Metric | Value |
|--------|-------|
| Routes compiled | 55 |
| Middleware | 30.4 KB |
| Shared First Load JS | 87.9 KB |
| Login route First Load | 185 KB |
| Build time | ~38s |

Command: `npm run build` — exit 0.

---

## New Dependency Impact

| Package | Version | Purpose |
|---------|---------|---------|
| `framer-motion` | 11.11.17 | Splash animation only |

Splash component is client-only; does not block SSR. Reduced-motion path skips animation timers.

---

## Runtime Performance

| Area | Approach |
|------|----------|
| Splash | GPU `opacity`/`scale`; single mount |
| Notification inbox | Pagination (20 items); staleTime 30s |
| Route loader | CSS width transition; no layout thrash |

---

## Lighthouse

`npm run perf:budget-check` validates bundle budgets only. Lighthouse runs on staging deploy per script comment — **not executed** in agent environment.

---

## Verdict

No bundle budget regression. v1.3.5 remains within established performance envelopes.
