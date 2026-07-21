# Production Gap Report — Phase 26 (v1.4.1)

**Date:** 2026-07-21  
**Verdict:** **READY WITH CONDITIONS**  
**Production Certified:** **NOT ISSUED**

Gaps below are separated by owner bucket. Software remediations in Phase 26 do **not** close operator or infrastructure evidence gaps.

---

## Code

| Gap | Severity | Notes |
|-----|----------|-------|
| Accept-invitation email-only (no signed token) | Medium | Expiry enforced |
| Expenses self-post APPROVED | Medium | |
| Regex HTML sanitizers | Medium | |
| No general API rate limit | Medium | Auth endpoints limited only |
| Report scale = list + fail-closed 422 | Medium | SQL aggregations long-term |
| Dependency high CVEs | Medium | Triage required — not claimed fixed |

---

## Staging

| Gap | Severity | Notes |
|-----|----------|-------|
| Staging deploy only when intentionally enabled | Process | `ENABLE_STAGING_DEPLOY` |
| Staging authenticated smoke with non-demo users | Open | Credentials + smoke script |
| Staging header / CSP validation on live origin | Open | |
| Staging load / report-range behaviour under realistic data | Open | Expect 422 on oversized ranges |

---

## Operator

| Gap | Severity | Notes |
|-----|----------|-------|
| Authenticated production smoke (non-demo Super Admin) | Blocker for Certified | |
| Backup / PITR restore drill with measured RTO | Blocker for Certified | |
| Risk acceptance signed for residual Mediums | Required for controlled rollout | |
| Confirm no demo accounts operational | Required | |
| Live FE security headers check | Required | |
| Visual / keyboard QA post-deploy | Required | |

---

## Infrastructure

| Gap | Severity | Notes |
|-----|----------|-------|
| Redis provisioned for durable BullMQ (multi-instance) | Recommended / conditional | In-process fallback otherwise |
| Production Postgres `DATABASE_URL` + healthy migrations | Required | |
| Private network / ACL for Redis if used | Recommended | |
| Observability retention / alert routing | Ops-owned | `/ops/metrics` present |

---

## What Phase 26 does **not** claim

- Production Certified  
- Live restore PASSED without attached evidence  
- Zero dependency vulnerabilities  
- Internet-scale unsupervised exposure readiness

**Next:** [MANUAL_ACTIONS_REQUIRED.md](./MANUAL_ACTIONS_REQUIRED.md).
