# WILMS — Project Status

**Last updated:** 2026-07-02  
**Current release:** v0.2.2 (v1.0.0 tag readiness)  
**Active phase:** RC1.3 — final certification on `release/rc1-3-final-certification`

---

## Executive summary

RC1.3 final certification: intelligent empty/error states, page descriptions, production re-sync. **Production smoke 17/29** (list endpoints HTTP 500 post-DB rebuild). **v1.0.0: NOT READY.**

**Recommendation:** Fix production API 500s → full smoke → E2E → re-certify. See `docs/page-validation/RC1.3-final-certification.md`

---

## RC1.1 production hotfix (2026-07-01) — merged

| Fix | Summary |
|-----|---------|
| Router RBAC bleed | Per-route guards — collectors no longer 403 on unrelated routes |
| Collector portal | `assertCollectorAccess()` — self + admin only |
| Display ID CI | `resolveCollectorDisplayId` respects `COL-011` style IDs |
| PWA stale bundles | SW cache v2, controllerchange reload |
| Connection status | Online / offline / reconnecting / sync pending chip |

Evidence: `docs/page-validation/RC1.1-final-acceptance.md`

---

## RC1.2 validation (2026-07-02)

| Gate | Result |
|------|--------|
| Git audit | PASS |
| Codebase health | PASS |
| Dependencies (0 critical) | PASS |
| Database (prod 11/11) | PARTIAL — staging cleanup blocked |
| API 132/132 | PASS |
| UI / E2E | FAIL (local ENOSPC) — manual matrix ≥90% |
| Performance budgets | PASS — Lighthouse perf 89 |
| Security + RBAC smoke | PASS |
| Full test suite | PASS (excl. E2E) |

Evidence: `docs/page-validation/RC1.2-*.md` (13 reports)

---

## Production

| Item | Status |
|------|--------|
| Railway API @ migrations 11/11 | ✅ |
| Vercel frontend | ✅ |
| Production smoke | ✅ 29/29 |
| RBAC smoke | ✅ 11/11 |
| Deploy SHA drift | ⚠️ `cf3ce10` on Railway vs merged `main` |

---

## Pending before v1.0.0

| Item | Owner |
|------|-------|
| Staging `cleanup-demo-financial-data.mjs` sign-off | Engineering |
| Re-run `npm run test:e2e` on CI / clean disk | Engineering |
| Production redeploy from `main` | Engineering |
| Git tag `v1.0.0` after stakeholder sign-off | Engineering |

---

## Quick verification

```bash
npm run verify:api-integrity    # expect 132/132 PASS
npm run verify:api-coverage     # expect 0 placeholder hits
npm run verify:mock-guard
npm run type-check
npm run build
npm run test -w @wilms/api      # expect 40/40
npm run test -w @wilms/frontend # expect 431
npm run smoke:production        # expect 29/29
npm run smoke:rbac              # expect 11/11
```

---

## Documentation index

| Release | Entry point |
|---------|-------------|
| RC1.2 | `docs/page-validation/RC1.2-final-report.md` |
| RC1.1 | `docs/page-validation/RC1.1-final-acceptance.md` |
| RC1 | `docs/page-validation/RC1-final-acceptance.md` |

---

**Verdict:** `READY FOR RC2` — await staging DB cleanup, E2E re-run, and stakeholder approval before `v1.0.0` tag.
