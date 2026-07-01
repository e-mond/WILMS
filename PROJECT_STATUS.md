# WILMS — Project Status



**Last updated:** 2026-07-01  

**Current release:** v0.2.2 (v1.0.0 tag readiness)  

**Active phase:** RC1.1 — production stabilization on `release/rc1-1-production-stabilization`



---



## Executive summary



RC1.1 stabilization: BFF encoding smoke, RBAC matrix, mock import guard, loading UX rollout, connection status chip, stale-bundle mitigation. API integrity 132/132, backend 40/40 tests, mock guard CI.



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



## RC1.1 production hotfix (2026-07-01)

| Fix | Summary |
|-----|---------|
| Router RBAC bleed | Per-route guards — collectors no longer 403 on notifications, uploads, capture-sessions |
| Collector portal | `assertCollectorAccess()` — self + admin only |
| Display ID CI | `resolveCollectorDisplayId` respects `COL-011` style IDs |
| Admin-fee 403 | Removed approver-only disbursement call from collector view |
| Synthetic amounts | No fake reconciliation totals when DB disabled |

Evidence: `docs/page-validation/RC1.1-production-verification.md`

---

## Production

| Item | Status |
|------|--------|
| Railway API @ migrations 11/11 | ✅ |
| Vercel frontend + BFF @ `8e0df23` | ✅ |
| Authentication (5 roles) + CSRF | ✅ |
| Production smoke | ✅ 24/24 |
| Collector portal live | ✅ |

---

## Pending

| Item | Owner |
|------|-------|
| Git tag `v1.0.0` after stakeholder sign-off | Engineering |
| `gh pr create` for RC1.1 docs branch | Engineering |

---

## Quick verification

```bash
npm run verify:api-integrity    # expect 132/132 PASS
npm run verify:api-coverage     # expect 0 placeholder hits
npm run type-check
npm run build
npm run test -w @wilms/api      # expect 40/40
npm run smoke:production
```

---

## Documentation index

| Release | Entry point |
|---------|-------------|
| RC1.1 | `docs/page-validation/RC1.1-final-acceptance.md` |
| P14.RC1 | `docs/page-validation/RC1-final-acceptance.md` |
| P14.6.4 | `docs/page-validation/P14.6.4-production-readiness.md` |

---

**Verdict:** RC1.1 hotfix deployed and verified. **v1.0.0 tag readiness** — pending stakeholder approval.


