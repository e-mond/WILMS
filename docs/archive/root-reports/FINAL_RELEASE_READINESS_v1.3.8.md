# Final Release Readiness — v1.3.8

**Target release:** v1.3.8 Final Hardening  
**Readiness date:** 2026-07-17

## Definition of Done

| Criterion | Status |
|---|---|
| Toasts never duplicate | ✅ Fixed (dedupe + baseline) — browser QA recommended |
| Spinners → skeletons | ✅ Active loading paths migrated |
| Mandatory guided tour + replay | ✅ Welcome dialog + Help FAB |
| Shadcn primary system | ✅ Audited; skeleton standardized |
| Friendly production errors | ✅ Boundaries + copy |
| Permission overrides E2E | ✅ API + UI |
| Role clone/delete fixed | ✅ Tested locally |
| Dead code removed from production paths | ✅ Spinner loading removed |
| All tests pass | ✅ 134 backend + 237 frontend |
| Production smoke | ⛔ Blocked without credentials |

## Gate Results

```
npm run type-check          ✅
npm run lint                ✅
npm run build               ✅
npm run test -w @wilms/api  ✅
npm run test -w @wilms/frontend ✅
npm run verify:api-integrity ✅
npm run verify:mock-guard   ✅
npm run smoke:production    ⛔ WILMS_APP_URL required
npm run smoke:rbac          ⛔ WILMS_SMOKE_* required
```

## Pre-Release Actions (Human)

1. Run production smoke with `WILMS_SMOKE_EMAIL` / `WILMS_SMOKE_PASSWORD`.
2. Browser QA: login toast, refresh, tab switch, product tour first login.
3. Tag `v1.3.8` after smoke sign-off.

## Recommendation

**Ready for staging / RC** pending authenticated production smoke. Not tagged as production-certified until smoke credentials are run successfully.
