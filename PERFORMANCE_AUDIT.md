# PERFORMANCE AUDIT — WILMS

**Audit date:** 2026-07-16  
**Audited code:** `main @ 10dfcbb`  
**Live evidence:** `/health` currently `status=ok`

## 1. Evidence collected in this audit pass

### Build and bundle budgets
- Frontend build: **PASS** (`npm run build -w @wilms/frontend`)
- `npm run bundle:budget-check`: **PASS**
  - JS total (gzip): **168.4 KB** (budget 350 KB)
  - CSS total (gzip): **9.4 KB** (budget 100 KB)
- `npm run perf:budget-check`: **PASS**
  - Budget envelopes pass

### Runtime performance measurements
- Lighthouse / Core Web Vitals: **NOT RUN** here (requires browser tooling + operator-controlled production URL conditions)
- Memory/CPU/network profiling: **NOT RUN** here

## 2. Likely performance hotspots (code-level audit)

Without a browser farm, this audit focuses on architectural hotspots evident from dependencies and render patterns:

### 2.1 Export generation libraries
Frontend includes:
- `exceljs`, `jspdf` (+ autotable), `docx`

Risk:
- Large client bundles and CPU spikes during large exports.

Mitigations already present/observed:
- Exports are routed behind user actions (not automatic background execution).
- Bundle budget checks pass for the current build, suggesting exports are not exploding baseline bundles.

### 2.2 Communication rich-text previews
Rich-text preview uses sanitized HTML rendering. This adds a small CPU cost when previewing, but only occurs when preview mode is active.

## 3. Performance readiness verdict

**Conditional PASS for bundle/perf budget gates.**

## 4. Residual performance risks (requires operator validation)

The following were not executed in this environment:
- Lighthouse on `https://wilms.vercel.app` for:
  - LCP
  - CLS
  - INP / FID
- Mobile Core Web Vitals (Android Chrome, iOS Safari)
- Network waterfall checks (API route latency; BFF proxy behavior under real sessions)
- Long-task / CPU profiling during:
  - large CSV/Excel/PDF exports
  - communication template preview mode

## 5. Required manual actions

- Run Lighthouse/CrUX style checks in production after authenticated smoke succeeds.
- Capture “export” page timings and Largest Contentful Paint during export generation for typical and worst-case data sizes.

