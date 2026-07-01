# WILMS — Project Status



**Last updated:** 2026-07-01  

**Current release:** v0.2.2  

**Active phase:** P14.RC1 — **Phase 2** production hardening (`rc1/phase-2-production-hardening`)



---



## Executive summary



P14.RC1 Phase 2 completes API coverage: risk flag CRUD, group/pool/collector creation, in-app messaging, notification dispatch, zero placeholder UI, 135/135 API integrity, and extended production smoke.



---



## RC1 production bugfix sprint (2026-06-20)

| Fix | Summary |
|-----|---------|
| Reports hub crash | `GET /reports/hub` returns full `ReportsHubMetadata`; aside panel guards |
| Officer 403 noise | Locations permission includes registration portal; inbox hidden for officers; graceful 403 retry |
| Demo seed cleanup | `cleanup-demo-financial-data.mjs`; `db:seed:reference` / `db:seed:demo`; production guard |
| Registration IDs | Shared Ghana Card / Voter / Passport validators + GPS geolocation |
| Loading policy | 300ms debounce, 30s timeout via `useQueryLoadingPolicy` |

See `docs/page-validation/RC1-registration-hardening.md`.

---

## RC1 completed



| Item | Evidence |

|------|----------|

| API integrity 135/135 | `npm run verify:api-integrity` |
| API coverage gate | `npm run verify:api-coverage` — 0 placeholders |
| Phase 2 — risk flag CRUD | `POST/PATCH /risk-flags/*` |
| Phase 2 — group/pool/collector create | `POST /groups`, `/loan-pools`, `/collectors` |
| Phase 2 — in-app messaging | `0010_messages` migration, `/messages/threads` |
| Phase 2 — notification dispatch | SMS/email in `sendNotification` + invite email |
| RC1 Phase 2 audit docs | `RC1-*-audit.md`, `RC1-release-notes.md` |
| API integrity 112/112 (Phase 1) | `RC1-api-audit.md` |



---



## Production (inherited P14.6.4)



| Item | Status |

|------|--------|

| Railway API @ migrations 11/11 | ✅ (0010 messages) |

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

npm run verify:api-integrity    # expect 135/135 PASS
npm run verify:api-coverage     # expect 0 placeholder hits

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


