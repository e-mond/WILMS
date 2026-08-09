# WILMS v1.8.0 — Performance Certification Report

**Generated (UTC):** 2026-08-09T19:28:30Z

## Verdict

**PARTIAL — lab metrics BLOCKED; bundle budget pending pipeline**

## Field metrics (FCP/LCP/CLS/INP/TTFB)

**BLOCKED** — no Lighthouse / Web Vitals capture against https://wilms.vercel.app in this sprint (no authenticated CrUX/lab run saved under `evidence/`).

## Bundle budget

Executed as part of engineering pipeline (`npm run bundle:budget-check` → `evidence/bundle-budget.log`). Status recorded in `ENGINEERING_CERTIFICATION_REPORT.md` after pipeline completion.

## Prior release pack

Historical notes exist in `docs/v1.8.0/PERFORMANCE_REPORT.md` (design-time targets) — **not** reused as this sprint’s production lab evidence.

## Close criteria

Lighthouse mobile+desktop JSON for `/login`, collector dashboard, executive, reports, reconciliation with scores and screenshots stored under `evidence/perf/`.
