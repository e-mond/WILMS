# WILMS — Project Status



**Last updated:** 2026-07-01  

**Current release:** v0.2.2  

**Active phase:** P14.RC1 — **Release Candidate 1** (production finalization branch)



---



## Executive summary



P14.RC1 stabilizes production with live dashboard data, settings API persistence, BFF proxy fixes, vitest security patches, Vercel build fix (PR #35), and comprehensive RC1 audit documentation.



---



## RC1 completed



| Item | Evidence |

|------|----------|

| API integrity 112/112 | `npm run verify:api-integrity`, `RC1-api-audit.md` |
| Hotfix PR #35 — Vercel/CI lint | jest-dom vitest types, `.eslintignore` for tests |
| Dashboard live data + settings 404 fix | PR #33 |
| Vitest 3.2.6 security patch | PR #34 — 0 critical audit findings |
| App lock 9-min idle + route loader | PR #33 |
| Borrower display IDs (BWR-*) | PR #33 |
| CI Node.js 22 | `.github/workflows/ci.yml` |
| RC1 audit documentation (14 reports) | `docs/page-validation/RC1-*.md` |



---



## Production (inherited P14.6.4)



| Item | Status |

|------|--------|

| Railway API @ migrations 10/10 | ✅ |

| Vercel frontend + BFF | ✅ (redeploy after PR #35) |

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

npm run verify:api-integrity    # expect 112/112 PASS

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


