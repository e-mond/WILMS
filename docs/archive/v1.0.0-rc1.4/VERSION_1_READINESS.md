# WILMS — Version 1.0 Readiness

**Audit date:** 2026-07-04 · **Current release:** v0.2.2 · **Commit:** `487708b`

---

## v1.0 criteria checklist

| Criterion | Met? | Evidence |
|-----------|------|----------|
| Production deployed & healthy | **Yes** | `/health` ok, deploy sync PASS |
| Schema migrated | **Yes** | 13/13 migrations |
| RBAC enforced | **Yes** | smoke 11/11 |
| Core workflows E2E | **Mostly** | Registration → approval → loan → collection implemented |
| No demo financial data in prod | **Unverified** | SQL/count audit not completed |
| All tests green | **No** | 3 frontend failures |
| Dependency CVEs addressed | **No** | 18 npm audit findings |
| Accessibility certified | **Partial** | Vercel pass in progress; test regressions |
| Documentation current | **Partial** | Updated in this audit |
| E2E certification | **No** | Playwright not re-run |
| Performance budgets | **Unknown** | Scripts exist; not executed |
| v1.0 git tag | **No** | Latest tag `v0.2.2` |

**v1.0 readiness score: 62%**

---

## Gap analysis — all remaining work

### Critical blockers

| # | Item | Why it matters | Effort | Risk | Recommendation |
|---|------|----------------|--------|------|----------------|
| C1 | Fix 3 failing unit tests | CI gate / release confidence | S (2h) | Low | Update test selectors for visible-text a11y pattern |
| C2 | Verify production DB has no demo financial rows | Data integrity / trust | S (4h) | **High** if demo data present | Run cleanup dry-run on Neon; document counts |
| C3 | Resolve high CVEs (drizzle, next) | Security compliance | M (1–2d) | High | Planned upgrade sprint with regression tests |
| C4 | Fix `/capture/[token]` public access | Mobile registration QR broken | S (4h) | Medium | Add to PUBLIC_PATHS or dedicated unauthenticated upload flow |

### High priority

| # | Item | Why | Effort | Risk | Recommendation |
|---|------|-----|--------|------|----------------|
| H1 | Production smoke 32/32 | CI/env hygiene | XS | Low | Update `EXPECTED_GIT_COMMIT` in `.env` / CI |
| H2 | HTTP integration tests for top 20 routes | API regression safety | M (3d) | Medium | Add to `@wilms/api` test suite |
| H3 | Replace GPS location stub | Registration address UX | S (1d) | Low | Real geolocation or remove "Use current location" |
| H4 | Run Playwright E2E on staging | End-user path validation | M (1d) | Medium | Pre-tag gate |
| H5 | Vercel accessibility re-audit | Compliance / inclusivity | S (4h) | Medium | After test fixes deployed |

### Medium priority

| # | Item | Why | Effort | Risk | Recommendation |
|---|------|-----|--------|------|----------------|
| M1 | Wire notification sounds globally | UX polish from RC1.4 roadmap | S | Low | Post-v1.0 or RC1.5 |
| M2 | Report panel unit tests (4 panels) | Regression coverage | M | Low | Incremental |
| M3 | Messages UI completion | Feature parity | M | Low | Assess usage requirement |
| M4 | Offline sync field validation | Collector rural use case | L | Medium | Pilot with users |
| M5 | Prune stale GitHub branches | Repo hygiene | S | Low | Admin task |
| M6 | Multipart upload support | Large document uploads | M | Low | Backlog |

### Low priority

| # | Item | Effort |
|---|------|--------|
| L1 | Remove unreachable `/` landing page | XS |
| L2 | Consolidate export entry points | S |
| L3 | Dead-code scan (knip) | S |
| L4 | Performance budget CI run | S |

### Nice-to-have

| # | Item |
|---|------|
| N1 | v1.0 marketing release notes |
| N2 | Neon read-replica / scaling doc |
| N3 | Full `docs/page-validation/` local checkout |

---

## RC1.4 vs v1.0 Release Candidate

| Phase | Scope | Status |
|-------|-------|--------|
| **RC1.4** (current) | Deploy sync, registration hardening, export, mobile nav, integrations UX, a11y | **~90% complete** — remaining: test fixes, capture route, data audit |
| **v1.0 RC** | All critical + high items closed; E2E green; tag `v1.0.0-rc.1` | **Not started** |
| **v1.0 GA** | UAT sign-off, CVEs patched, production data certified clean | **Not ready** |

**Recommendation:** Finish RC1.4 closure items (C1–C4, H1, H5) before declaring v1.0 Release Candidate — do **not** add new feature scope until blockers cleared.

---

## Estimated timeline to v1.0 (assuming focused effort)

| Milestone | Duration |
|-----------|----------|
| RC1.4 closure (blockers) | 3–5 days |
| v1.0 RC + UAT | 1–2 weeks |
| CVE upgrade + E2E | 1 week |
| **Total to v1.0 GA** | **~3–4 weeks** |

Estimates assume no major architectural changes.
