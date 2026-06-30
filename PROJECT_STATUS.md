# WILMS — Project Status

**Last updated:** 2026-06-30  
**Current release:** v0.2.2  
**Active phase:** P14.RC1 — **Release Candidate 1**

---

## Executive summary

P14.RC1 stabilizes production by fixing the **ERR_CONTENT_DECODING_FAILED** BFF proxy defect, implementing five report APIs that were placeholder stubs, removing silent API fallbacks, standardizing loading UX primitives, and completing RC1 validation documentation.

---

## RC1 completed

| Item | Evidence |
|------|----------|
| BFF proxy encoding fix | `apps/frontend/src/lib/api/proxy-headers.ts`, `RC1-content-decoding-rca.md` |
| Five report domain modules | `apps/backend/src/domain/reports/*.ts`, `RC1-report-api-audit.md` |
| API integrity 107/107 | `npm run verify:api-integrity`, `RC1-api-integrity.md` |
| Loading UX primitives | `Skeleton`, `QueryStatePanel`, `RC1-loading-ux.md` |
| Navbar Online badge removed | `AppNavbar.tsx`, role shells |
| Version consistency | `OfficeShell.tsx` → `getAppVersionLabel()` |
| RC1 documentation set (13 reports) | `docs/page-validation/RC1-*.md` |

---

## Production (inherited P14.6.4)

| Item | Status |
|------|--------|
| Railway API @ migrations 9/9 | ✅ |
| Vercel frontend + BFF | ✅ (redeploy for RC1) |
| Authentication (5 roles) + CSRF | ✅ |
| Smoke tests | Re-run after RC1 deploy |

---

## Pending

| Item | Owner |
|------|-------|
| Deploy RC1 to Vercel + Railway | Engineering |
| `npm run smoke:production` after deploy | CI / operator |
| Git tag `v0.2.2-rc1` after stakeholder sign-off | Engineering |
| Repository temp file cleanup (approval gate) | Engineering |

---

## Quick verification

```bash
npm run verify:api-integrity    # expect 107/107 PASS
npm run type-check
npm run build
npm run test -w @wilms/api      # expect 16/16
npm run smoke:production        # after deploy
```

---

## Documentation index

| Release | Entry point |
|---------|-------------|
| P14.RC1 | `docs/page-validation/RC1-final-acceptance.md` |
| P14.6.4 | `docs/page-validation/P14.6.4-production-readiness.md` |
| P14.6.3 | `docs/page-validation/P14.6.3-production-acceptance.md` |

---

**Verdict:** RC1 code complete. **Release Candidate Accepted** pending production deploy verification and stakeholder approval.
