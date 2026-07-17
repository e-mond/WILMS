# Launch Readiness Scorecard — WILMS v1.3.8

**Phase:** 21 — Product Acceptance  
**Date:** 17 July 2026  
**Version:** 1.3.8 (`package.json`, `main` + Phase 20 PR #126)

Scores are **out of 100**. Evidence paths cited. Overall is a weighted composite ≈ **83**.

---

## 1. Dimension scores

| Dimension | Score | Weight | Evidence |
|-----------|------:|-------:|----------|
| Architecture | **82** | 10% | Turborepo monorepo (`package.json` workspaces); module boundaries under `apps/backend/src/modules/`; BFF proxy `apps/frontend/next.config.mjs`; ADRs in `docs/adr/` |
| Security | **85** | 12% | `mock-guard.ts`, `require-permission.ts`, session invalidation tests, v1.3.8 IDOR fixes in `CHANGELOG.md`, `docs/security-guide.md` |
| Financial Integrity | **88** | 14% | `buildDashboardFinancialOverview`, pool ledger `docs/financial-calculations.md`, migrations `0024`–`0027`, admin-fee workflow tests |
| Performance | **78** | 8% | `0027_hot_query_indexes.sql`, list query indexes `0021`, bundle/perf budget scripts in root `package.json`; no 100k+ proof |
| Scalability | **62** | 6% | In-process workers (`ops/service.ts`); single Railway API assumption; Redis deferred v1.4 |
| Reliability | **80** | 10% | Health + ops surfaces; backup external (Neon); no PITR restore evidence filed |
| Maintainability | **84** | 8% | 0 TODO/FIXME/HACK in apps+packages; 150 backend + 160+ frontend test files; shared packages |
| Documentation | **90** | 8% | `docs/README.md` hub, Phase 20 ops pack, Phase 21 acceptance pack, permission + financial SoT docs |
| UX | **82** | 8% | 32/32 nav hrefs live, product tour, skeletons, error boundaries; role shells tested |
| Accessibility | **72** | 4% | Component tests (`CurrencyAmount`, forms); full WCAG audit not re-run Phase 21 |
| Operations | **86** | 8% | `/ops` dashboard, Prometheus metrics, incident/deploy runbooks, alert matrix |
| Support | **80** | 6% | `PRODUCTION_SUPPORT_MANUAL.md`, five role guides, demo users for rehearsal |
| Deployment | **84** | 8% | `DEPLOYMENT_RUNBOOK.md`, `verify:migrations`, `verify:deploy-sync`, Vercel + Railway documented |

---

## 2. Weighted overall calculation

```
Overall ≈ (82×0.10) + (85×0.12) + (88×0.14) + (78×0.08) + (62×0.06)
        + (80×0.10) + (84×0.08) + (90×0.08) + (82×0.08) + (72×0.04)
        + (86×0.08) + (80×0.06) + (84×0.08)
        ≈ 82.7 → 83/100
```

**Overall weighted score: ≈ 83/100**

---

## 3. Gate matrix

| Gate | Threshold | Actual | Pass |
|------|-----------|--------|------|
| Backend tests | 0 failures | 150/150 | ✅ |
| RBAC SoD collector groups | No `MANAGE_GROUPS` | Confirmed `role-permissions.ts` | ✅ |
| Production mock | Blocked | `mock-guard.ts` | ✅ |
| Nav dead ends | 0 | 32 hrefs → `page.tsx` | ✅ |
| Journal migrations in repo | 28 entries | `_journal.json` idx 0–27 | ✅ |
| Migration 0027 on all envs | Applied | **Pending ops** | ⚠ |
| Staging E2E smoke | Evidence filed | **Pending** | ⚠ |
| Neon restore test | Evidence filed | **Pending** | ⚠ |
| Unconditional prod (≥90 overall + gates) | — | 83 + 3 open gates | ❌ |

---

## 4. Score rationale (deductions)

| Dimension | Why not higher |
|-------------|----------------|
| Scalability (62) | No Redis/BullMQ; in-process queue; no multi-instance worker story |
| Accessibility (72) | No Phase 21 WCAG certification |
| Performance (78) | Indexes added but no load test at programme scale |
| Reliability (80) | Backup restore not evidenced this phase |
| Architecture (82) | BFF + monolith acceptable; queue/GL deferred |

---

## 5. Conditions blocking unconditional launch

1. Apply `0027_hot_query_indexes` on staging and production
2. File staging authenticated E2E smoke (five roles, money chain)
3. Complete Neon PITR restore drill with log
4. Acknowledge v1.3.8 limitations (queues, no GL, no borrower portal)

---

## 6. Recommendation mapping

| Score band | Recommendation |
|------------|----------------|
| ≥ 90 + all gates | ✅ Ready for Production |
| 80–89 or open gates | ⚠ Ready with Conditions |
| < 80 | ❌ Not Ready |

**v1.3.8:** **83** + open gates → **⚠ Ready with Conditions**

See [FINAL_PRODUCT_CERTIFICATION.md](./FINAL_PRODUCT_CERTIFICATION.md).
