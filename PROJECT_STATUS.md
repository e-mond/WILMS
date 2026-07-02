# WILMS — Project Status

**Last updated:** 2026-07-02  
**Current release:** v0.2.2  
**Active phase:** RC1.3.2 — post-deployment verification on `main`

---

## Executive summary

RC1.3.2 post-deployment verification complete. **NOT PRODUCTION CERTIFIED.**

Live evidence (2026-07-02T22:41Z): production smoke **17/29**, RBAC smoke **7/11**, Railway `/health` reports `gitCommit: cf3ce10` while GitHub `main` is `8a83278`. RC1.3 branch (`release/rc1-3-final-certification`) is **not merged** to `main`.

**Recommendation:** Redeploy from merged `main` (include RC1.3 merge if approved), fix list-endpoint HTTP 500s, re-run RC1.3.2 gates. See `docs/page-validation/RC1.3.2-production-certification.md`.

---

## RC1.3.2 gates (2026-07-02)

| Gate | Result |
|------|--------|
| Git ↔ production SHA | **FAIL** |
| Version 0.2.2 sync | **PASS** |
| API integrity / coverage / mock guard | **PASS** (repo) |
| Production smoke | **FAIL 17/29** |
| RBAC smoke | **FAIL 7/11** |
| Local type-check / lint / build / backend tests | **PASS** |
| npm audit critical | **PASS (0 critical)** |

Evidence: `docs/page-validation/RC1.3.2-*.md` (12 reports)

---

## Production

| Item | Status |
|------|--------|
| Railway API @ migrations 11/11 | ✅ |
| Vercel frontend login | ✅ 200 |
| Production smoke | ❌ **17/29** |
| RBAC smoke | ❌ **7/11** |
| Deploy SHA | ❌ `cf3ce10` vs `main` `8a83278` |
| RC1.3 merged | ❌ Not on `main` |

---

## Pending before PRODUCTION CERTIFIED / v1.0.0

| Item | Owner |
|------|-------|
| Merge RC1.3 → `main` (if approved) | Engineering |
| Redeploy Railway + Vercel from same commit | Ops |
| Fix production list API 500s | Engineering |
| smoke 29/29 + rbac 11/11 | QA |
| Re-run RC1.3.2 certification | Engineering |
| Staging demo DB cleanup | Ops |
| E2E full green | Engineering |
| Git tag `v1.0.0` after sign-off | Engineering |

---

## Quick verification

```bash
npm run verify:version          # expect 0.2.2 PASS
npm run verify:api-integrity    # expect 132/132 PASS
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
npm run smoke:production        # expect 29/29 (currently 17/29)
npm run smoke:rbac              # expect 11/11 (currently 7/11)
curl -s https://wilms-production.up.railway.app/health | jq .data.gitCommit
```

---

## Prior phases

- **RC1.2** — `docs/page-validation/RC1.2-final-report.md` — READY FOR RC2
- **RC1.1** — merged PR #43 — production hotfixes
- **RC1.3** — on branch `release/rc1-3-final-certification` — UX/empty states (not merged)
