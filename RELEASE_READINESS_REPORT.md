# RELEASE_READINESS_REPORT.md

**Project:** WILMS  
**Release type:** Stabilization (no new features)  
**Version:** 1.3.3 → 1.3.4 (proposed)  
**Date:** 2026-07-11

---

## 1. Release Objective

Fix mobile capture session failure, harden security (password reset session invalidation), improve observability, and certify platform readiness with evidence-based reporting.

---

## 2. Changes in This Release

| Change | Severity | Files |
|--------|----------|-------|
| Mount public routers before authenticated routers | P0 | `apps/backend/src/http/app.ts` |
| Exempt capture paths from BFF CSRF | P1 | `apps/frontend/src/app/api/wilms/[...path]/route.ts` |
| Improve mobile capture error messages | P2 | `apps/frontend/src/app/capture/[token]/page.tsx` |
| Add capture public route tests | P1 | `apps/backend/src/tests/photo-capture/public-routes.test.ts` |
| Add capture structured logging | P2 | `apps/backend/src/modules/photo-capture/service.ts` |
| Extend production smoke for capture | P1 | `apps/backend/src/verification/production-smoke.ts` |
| Password reset invalidates sessions | P1 | `apps/backend/src/modules/auth/password-reset.service.ts` |
| Nine audit reports generated | — | Repository root |

---

## 3. Verification Results (Recorded 2026-07-11)

| Gate | Command | Result |
|------|---------|--------|
| TypeScript | `npm run type-check` | **PASS** |
| ESLint | `npm run lint` | **PASS** (0 warnings) |
| Production build | `npm run build` | **PASS** |
| Backend tests | `npm test -w @wilms/api` | **100/100 PASS** |
| Frontend tests | `npm test` (frontend) | **233/233 PASS** |
| API integrity | `npm run verify:api-integrity` | **PASS** |
| API coverage | `npm run verify:api-coverage` | **PASS** (54 pages, 0 placeholders) |
| Mock import guard | `npm run verify:mock-guard` | **PASS** |
| Bundle budget | `npm run bundle:budget-check` | **Not run** in this audit |
| Perf budget | `npm run perf:budget-check` | **Not run** in this audit |
| `smoke:production` | Requires `WILMS_APP_URL` + `WILMS_API_URL` | **Not verified—requires runtime** |
| `smoke:rbac` | Requires live deployment | **Not verified—requires runtime** |
| Mobile capture E2E | Physical device | **Not verified—requires runtime** |

---

## 4. Phase 15 Certification Checklist

| Criterion | Status | Evidence |
|-----------|--------|----------|
| No TypeScript errors | ✓ PASS | type-check |
| No ESLint errors | ✓ PASS | lint |
| Successful production build | ✓ PASS | build |
| Critical workflows verified | **PARTIAL** | Capture fixed in code; production E2E pending |
| Security review complete | ✓ PASS | `SECURITY_ASSESSMENT_REPORT.md` |
| Documentation updated | **PARTIAL** | Audit reports generated; user guides need capture update |
| No verified dead code removed | ✓ PASS | Zero-ref items reported, not removed |
| No broken routes | ✓ PASS (code) | API integrity gate |
| No console/runtime errors | **Not verified** | Requires browser QA |
| No known regressions | ✓ PASS | All unit tests green |

---

## 5. Pre-Deploy Requirements

### Railway (Backend)

- [ ] `DATABASE_URL` — required for capture
- [ ] `WILMS_SESSION_SECRET`
- [ ] `WILMS_APP_URL` = `https://wilms.vercel.app` (or production domain)
- [ ] `WILMS_CORS_ORIGIN` = Vercel frontend origin
- [ ] `UPLOAD_PROVIDER=cloudinary` (recommended for multi-instance)
- [ ] Migrations applied (including `0011_rc14_registration_capture.sql`)

### Vercel (Frontend)

- [ ] `WILMS_API_UPSTREAM` = Railway backend URL
- [ ] `NEXT_PUBLIC_API_BASE_URL` = `/api/wilms`
- [ ] `NEXT_PUBLIC_USE_MOCK` = `false` (or unset in production)

---

## 6. Post-Deploy Verification

```bash
# 1. Capture lookup must NOT return 401
curl -sS -o /dev/null -w "%{http_code}\n" \
  "https://wilms.vercel.app/api/wilms/photo-capture/sessions/pcs_invalid00000001"
# Expected: 404 or 503

# 2. Production smoke
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
WILMS_SMOKE_EMAIL=... \
WILMS_SMOKE_PASSWORD=... \
npm run smoke:production -w @wilms/api

# 3. RBAC smoke
WILMS_APP_URL=https://wilms.vercel.app \
npm run smoke:rbac -w @wilms/api

# 4. Manual: desktop QR → mobile scan → capture → desktop sync
```

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Router reorder regression | Low | High | `public-routes.test.ts` + smoke checks |
| CSRF exemption too broad | Low | Medium | Path prefix `photo-capture/sessions/` only; token-gated |
| Production not redeployed | Medium | Critical | Post-deploy curl verification |
| Upload provider local disk | Medium | Medium | Use Cloudinary in production |

---

## 8. Release Decision

| Decision | Rationale |
|----------|-----------|
| **APPROVE for merge** | P0 root cause fixed with test coverage; all CI gates pass |
| **CONDITIONAL production cert** | Requires deploy + smoke + manual mobile capture test |

---

## 9. Deliverables

| Report | Status |
|--------|--------|
| `ROOT_CAUSE_ANALYSIS.md` | ✓ Generated |
| `ENGINEERING_AUDIT_REPORT.md` | ✓ Generated |
| `SECURITY_ASSESSMENT_REPORT.md` | ✓ Generated |
| `USER_FLOW_CERTIFICATION.md` | ✓ Generated |
| `ROLE_CERTIFICATION_REPORT.md` | ✓ Generated |
| `PERFORMANCE_REVIEW.md` | ✓ Generated |
| `FEATURE_UTILIZATION_REVIEW.md` | ✓ Generated |
| `DOCUMENTATION_REVIEW.md` | ✓ Generated |
| `RELEASE_READINESS_REPORT.md` | ✓ Generated |

---

## 10. Sign-Off

**Engineering stabilization:** Code complete, tests pass, reports delivered.  
**Production release:** Pending deployment verification.
