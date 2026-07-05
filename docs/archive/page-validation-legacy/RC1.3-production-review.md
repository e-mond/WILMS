# RC1.3 ÔÇö Production Review

**Git SHA:** `82452553be0c3352c48ebecfa6406fb2f7163207` (base) + RC1.3 working tree  
**Date:** 2026-07-02T18:50:00Z  
**Branch:** `release/rc1-3-final-certification`  
**Result:** **FAIL** ÔÇö production list endpoints returning HTTP 500

## Synchronization matrix

| Surface | Expected | Observed | Status |
|---------|----------|----------|--------|
| GitHub branch | `release/rc1-3-final-certification` | Active | PASS |
| Package version | `0.2.2` | `0.2.2` (`verify:version` PASS) | PASS |
| Railway health | 200, DB connected, 11/11 migrations | Intermittent connectivity during audit; prior: OK | PARTIAL |
| Railway `gitCommit` | Matches deployed RC | `cf3ce10` (lags merged `main`) | DRIFT |
| Vercel login | 200 | 200 (HEAD) | PASS |
| Cloudinary uploads | configured | `valid: true` on health | PASS |
| Neon / migrations | 11/11 | 11/11 when health reachable | PASS |
| Production smoke | 29/29 | **17/29** | **FAIL** |
| RBAC smoke | 11/11 | Not re-verified (blocked by prod smoke gate) | PENDING |

## Smoke failures (production)

```
Ô£ù bff-proxy-dashboard: status=500
Ô£ù bff-proxy-groups: status=500
Ô£ù bff-proxy-loan-pools: status=500
Ô£ù bff-proxy-risk-flags: status=500
Ô£ù bff-proxy-messages: status=500
Ô£ù bff-proxy-collectors: status=500
Ô£ù bff-proxy-borrowers: status=500
Ô£ù bff-proxy-loans-portfolio: status=500
```

**Likely cause:** Production database rebuilt (tables regenerated) ÔÇö backend list aggregations may error on empty/partial schema state or missing reference joins. Requires Railway log review and post-rebuild API fix deploy.

## Pass gate

Production must return 200 on all smoke-checked BFF routes before v1.0.0 recommendation.
