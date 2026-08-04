# RC1.1 — Technical Debt Register

**Date:** 2026-07-01  
**Branch:** `release/rc1-production-final`

---

## Resolved in hotfix (8e0df23)

| Item | Resolution |
|------|------------|
| Router-level RBAC blocking unrelated routes | Per-route `requirePermission` on collectors, reports, groups, dashboard, analytics, risk-flags, photo-capture |
| Collector dashboard 403 for own user | `assertCollectorAccess()` — self-access + admin override |
| Synthetic reconciliation amounts when DB off | Removed `5000` pesewas fallback; returns zeroed summary |
| Admin-fee panel calling approver API | `DisbursementGateAlert` gated behind `APPROVE_LOANS`; collector view uses `useAdminFeeStatus` |
| `COL-011` display ID CI failure | `resolveCollectorDisplayId` respects readable `id` values |

---

## Open (non-blocking for v1.0.0)

| ID | Area | Description | Priority |
|----|------|-------------|----------|
| TD-01 | Dependencies | Next.js 14 — high audit advisories; upgrade path to 15 deferred | Medium |
| TD-02 | Dependencies | Drizzle ≥0.45.2 advisory | Low |
| TD-03 | Security | Global API rate limit (login-only today) | Medium |
| TD-04 | Security | Server-side session revocation list | Low |
| TD-05 | Ops | `WILMS_GIT_COMMIT` on Railway may lag deploy source | Low |
| TD-06 | API matrix | 23 orphan backend routes — document in OpenAPI or trim dead routes | Low |
| TD-07 | Notifications | SMS/email adapters exist; limited workflow call sites | Medium |
| TD-08 | E2E | Playwright suite not in CI gate | Low |

---

## Code hygiene scan

| Pattern | `apps/frontend/src/features` | `apps/backend/src/modules` |
|---------|------------------------------|----------------------------|
| TODO / FIXME / HACK | 0 | 0 |
| `console.log` (prod code) | 0 | 0 |

---

## Verdict

**ACCEPTABLE** for v1.0.0 tag readiness — no P0/P1 debt remaining from production hotfix scope.
