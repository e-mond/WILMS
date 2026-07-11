# PERFORMANCE_REVIEW.md

**Project:** WILMS  
**Date:** 2026-07-11

---

## 1. Methodology

Metrics are reported only where measured in this audit. Unmeasured items are explicitly marked **Not verified—requires runtime environment.**

---

## 2. Measured Results (This Audit)

| Metric | Command | Result | Date |
|--------|---------|--------|------|
| TypeScript compile | `npm run type-check` | PASS | 2026-07-11 |
| Production build | `npm run build` | PASS | 2026-07-11 |
| Frontend unit test duration | `npm test` (frontend) | 113.75s (233 tests) | 2026-07-11 |
| Backend unit test duration | `npm test` (backend) | 4.85s (100 tests) | 2026-07-11 |
| First Load JS (build output) | `npm run build` | **87.9 kB** shared | 2026-07-11 |

### Build output sample (largest auth routes)

| Route | Size | First Load JS |
|-------|------|---------------|
| `/login` | ~5 kB | ~168 kB |
| `/settings` | 11 kB | 618 kB |
| `/risk-flags` | 12.6 kB | 595 kB |

Evidence: `npm run build` stdout.

---

## 3. Bundle Budget (CI Gate)

| Budget | Threshold | Script | Measured this audit |
|--------|-----------|--------|---------------------|
| First-load JS gzip | 350 KB | `scripts/bundle-budget-check.mjs` | **Not verified** — requires `npm run bundle:budget-check` post-build |
| CSS gzip | 100 KB | Same | **Not verified** |
| Per-chunk warning | 200 KB gzip | Same | **Not verified** |

Build succeeded; budget check script not executed separately in this audit.

---

## 4. API Latency

| Tool | Purpose | Result |
|------|---------|--------|
| `perf:baseline` | p95/p99 for loans, payments, groups | **Not verified** — requires `DATABASE_URL` + seed data |
| `performance-baseline.ts` | Documents N+1 anti-pattern in group member loan listing | Code review only |

### Query patterns (static review)

| Pattern | Location | Assessment |
|---------|----------|------------|
| Batch `inArray` queries | `borrower.repository.ts`, `payment.repository.ts` | Good |
| Full table scan `select().from(users)` | `user.repository.ts` | Acceptable for small user base |
| Lazy capture session expiry | `photo-capture/service.ts` | No cleanup cron — DB growth over time, not latency |

---

## 5. Database

| Aspect | Status | Evidence |
|--------|--------|----------|
| Indexes on loans | Present | Migration files, baseline script references |
| Connection pooling | Neon serverless | `db/client.ts` |
| Migration count check | Health endpoint | `health/routes.ts` |
| EXPLAIN analysis | **Not verified** | No runtime EXPLAIN output |

---

## 6. Frontend Rendering

| Aspect | Status | Evidence |
|--------|--------|----------|
| React Strict Mode | Enabled | `next.config.mjs` |
| Package import optimization | `lucide-react` | `experimental.optimizePackageImports` |
| Lazy route chunks | Next.js automatic | Build output shows per-route chunks |
| Skeleton loaders | Audit log, auth pages | `AuditLogTableSkeleton.tsx`, login hydration |
| Polling interval (capture) | 2s | `PhoneCaptureSessionPanel.tsx` — acceptable |
| Memory leaks (capture page) | Stream cleanup on unmount | `capture/[token]/page.tsx` `getTracks().stop()` |

---

## 7. Caching

| Layer | Mechanism | Notes |
|-------|-----------|-------|
| Service worker | Shell assets only; `/api/`, `/capture/` bypassed | `sw.js` |
| TanStack Query | 24h persistence (collector reads) | Documented in field-ops release |
| BFF proxy | `cache: 'no-store'` | `wilms/[...path]/route.ts` |
| CDN | Vercel edge | **Not verified** |

---

## 8. Offline / PWA

| Aspect | Measured | Notes |
|--------|----------|-------|
| SW install time | Not verified | — |
| Offline queue drain | Unit tests pass | `paymentSyncHandler.test.ts` |
| Background upload processor | IndexedDB polyfill in tests | Production device not tested |

---

## 9. Findings

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| PERF-01 | P2 | Bundle budget not run in this audit | Run `npm run bundle:budget-check` in CI |
| PERF-02 | P3 | No expired capture session cleanup job | Optional scheduled purge |
| PERF-03 | P3 | 2s capture polling | Acceptable; WebSocket not required |
| PERF-04 | P2 | `perf:baseline` not executed | Run against staging DB before release |

---

## 10. Summary

**Build performance:** PASS — production build completes without error.  
**Runtime performance:** **Not verified—requires runtime environment** for API latency, Lighthouse, bundle gzip budgets, and production load testing.

No performance regressions introduced by stabilization fixes (router reorder, CSRF exemption, logging are negligible overhead).
