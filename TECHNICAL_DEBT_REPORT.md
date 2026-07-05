# WILMS — Technical Debt Report

**Audit date:** 2026-07-04 · **Commit:** `487708b`

---

## TODO / FIXME / HACK scan

| Location | Count | Notes |
|----------|-------|-------|
| `apps/**/*.ts(x)` | **0** matches for `\bTODO\b`, `\bFIXME\b`, `\bHACK\b` | Clean application source |
| `scripts/rc1-api-coverage.mjs` | 1 | Placeholder regex includes "TODO endpoint" (scanner only) |
| `packages/shared-validation` | Ghana card format comments only | Not debt markers |

---

## Mock data & dual-mode complexity

| Item | Risk | Detail |
|------|------|--------|
| Mock service layer | Medium | ~60 files in `services/mock/` — required for dev; webpack alias switches mode |
| Utils importing mock stores | Low | `defaulter-report.ts`, `collector-payment-inputs.ts`, `group-profile.ts` — mock-only helpers |
| Demo users in production DB | Low | `*@wilms.demo` used for smoke — intentional |
| Demo financial seed | Medium | Must not run in prod; cleanup script exists |

---

## Hardcoded values

| Item | Location | Recommendation |
|------|----------|----------------|
| GPS stub `0,0` | `modules/locations/routes.ts` | Implement or remove UI dependency |
| Demo passwords in smoke | `rbac-production-smoke.ts`, `production-smoke.ts` | Acceptable for smoke; use env override in CI |
| Role home redirects | Middleware | Document matrix |

---

## Dead / legacy code

| Item | Status |
|------|--------|
| Unused API routes | **Not fully mapped** — ~158 routes; frontend grep not exhaustive |
| Unused components | **Not scanned** — no automated dead-code analysis run |
| Stale remote branches | 30+ `origin/feature/*`, `origin/release/*` on GitHub — prune policy needed |
| Root landing `/` | Effectively dead — middleware redirects away |

---

## Duplicate / parallel implementations

| Item | Detail |
|------|--------|
| Dual API mount | `/api/v1/*` and `/*` — intentional backward compatibility |
| Export CSV button vs WilmsExportActions | Two entry points — unified over time |
| Settings integrations status | Both standalone route and embedded in GET `/settings` |

---

## Temporary / recovery scripts

| Script | Purpose |
|--------|---------|
| `cleanup-demo-financial-data.mjs` | Production demo row removal |
| `verify-deploy-sync.mjs` | Deploy SHA check |
| `rc1-api-coverage.mjs` | Placeholder scan |
| `rc1-api-integrity.mjs` | Frontend/backend path cross-check |
| `cert:*` verification scripts | Certification harnesses in `apps/backend/src/verification/` |

---

## Known bugs / incomplete features

| Item | Severity |
|------|----------|
| `/capture/[token]` blocked by middleware | High for mobile QR flow |
| `GET /locations/current` stub | Medium |
| Multipart upload not enabled | Low |
| Notification sounds hook not globally wired | Low |
| 3 frontend test failures after a11y pass | Medium |
| Sparse checkout breaks `verify:api-coverage` write | Low (local dev) |

---

## Dependency debt

18 npm audit vulnerabilities — see `SECURITY_STATUS_REPORT.md`. Priority: `drizzle-orm`, `next`.

---

## Documentation debt

| Item | Detail |
|------|--------|
| CHANGELOG | Multiple unreleased sections; lagging HEAD |
| `PROJECT_STATUS` | Was behind deploy SHA |
| 500+ files in `docs/page-validation/` | Rich but sparse-checkout excludes many locally |

---

## Test debt

| Gap | Impact |
|-----|--------|
| ~140 routes without HTTP tests | Regression risk on API changes |
| 4 report panels without unit tests | UI regression risk |
| E2E not run in this audit | Release confidence gap |
| Windows Vitest duration ~6 min | CI ergonomics |

---

## Recommendations (priority order)

1. Fix a11y test regressions (3 tests)  
2. Upgrade drizzle + patch next  
3. Fix `/capture/[token]` middleware  
4. Production Neon data audit + cleanup dry-run  
5. Prune stale GitHub branches  
6. Add API HTTP test suite for critical paths  
7. Run dead-code analysis (knip/ts-prune) in CI
