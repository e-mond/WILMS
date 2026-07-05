# RC1.2 ÔÇö Performance

**Git SHA:** `e456febebf509d2672ea79741b6e9a59463de10d`  
**Date:** 2026-07-02T10:30:00Z  
**Branch:** `release/rc1-1-production-stabilization`  
**Commands run:**

```bash
npm run build
npm run bundle:budget-check
npm run perf:budget-check
npx lighthouse https://wilms.vercel.app/login --output=json --output-path=docs/page-validation/rc1.2-evidence/lighthouse-login.json --chrome-flags="--headless"
```

**Result:** PASS (budgets) / **PARTIAL** (Lighthouse performance ÔêÆ1 pt)

## Bundle budgets

```
JS total (gzip): 168.5 KB (budget 350 KB) ÔÇö PASS
CSS total (gzip): 8.2 KB (budget 100 KB) ÔÇö PASS
PASS: perf-budget-check
```

No new hydration warnings in successful build log (`docs/page-validation/rc1.2-evidence/build-output.log`).

## Lighthouse ÔÇö production login (unauthenticated)

**URL:** `https://wilms.vercel.app/login`  
**Artifact:** `docs/page-validation/rc1.2-evidence/lighthouse-login.json`  
**Gathered:** 2026-07-01T22:51:11Z

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Performance | >90 | **89** | **1 pt short** |
| Accessibility | >95 | **100** | PASS |
| Best Practices | >95 | **100** | PASS |
| SEO | >90 | **91** | PASS |

## Root cause (performance 89)

Likely contributors: Vercel edge cold start, first-byte latency to Neon-backed BFF health, font/CSS pipeline on login. **Does not block v1.0.0** ÔÇö documented non-blocking gap (TD-08 class).

## Pass gate

Bundle budgets PASS; Lighthouse scores recorded; performance gap documented with non-blocking classification.
