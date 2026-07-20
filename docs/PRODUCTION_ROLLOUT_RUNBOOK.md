# WILMS Production Rollout Runbook — v1.4.1

**Date:** 2026-07-20  
**Audit verdict:** READY WITH CONDITIONS — [FINAL_RELEASE_DECISION.md](./certification/v1.4/final-system-audit/FINAL_RELEASE_DECISION.md)  
**Certificate:** NOT ISSUED

Use this for a **controlled** rollout. Complete [FINAL_MANUAL_ACTIONS_REQUIRED.md](./certification/v1.4/final-system-audit/FINAL_MANUAL_ACTIONS_REQUIRED.md) in parallel.

---

## Preconditions

| Check | Requirement |
|-------|-------------|
| Version | `1.4.1` consistent (`npm run verify:version`) |
| Node | 22 on CI and deploy workflows |
| Demo guard | `NODE_ENV=production`; `ALLOW_DEMO_SEED` unset/false |
| Database | Real `DATABASE_URL` (Postgres) |
| Staging flag | `ENABLE_STAGING_DEPLOY` only when staging deploy intended |
| Secrets | Non-demo Super Admin; smoke credentials ready |

---

## Recommended sequence

### 1. Staging (gated)

1. Set `ENABLE_STAGING_DEPLOY=true` only for the intended window.  
2. Deploy via `deploy-staging.yml` (Node 22).  
3. `GET /health` — status ok / degraded understood; migrations watermark current.  
4. Authenticated smoke + RBAC sample (`smoke:staging` / `smoke:rbac`).  
5. Spot-check: login, collector payment entry (assigned borrower), money report with narrow date range, admin fee status.  
6. Confirm FE security headers on staging origin.

### 2. Production deploy

1. Change freeze / release ticket linked to this audit pack.  
2. Deploy via `deploy-production.yml`.  
3. Health + version `1.4.1`.  
4. Authenticated production smoke (non-demo).  
5. Confirm demo login rejected.  
6. Confirm revoked session cannot use `/auth/session`.

### 3. Controlled user enablement

1. Enable a small staff cohort (one collector + one approver + Super Admin).  
2. Monitor error logs, 422 report refusals, auth failures.  
3. Expand cohort only after 24–72h stable window (org policy).

---

## Rollback triggers

- Health migrations **degraded** unexpectedly after deploy  
- Spike of 500s or auth outages  
- Financial discrepancy confirmed by Finance  
- Accidental demo seed / demo login possible in production (misconfig)

Rollback: redeploy previous known-good release artifact; keep DB restore plan ready (PITR). See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## Post-deploy monitoring (minimum)

| Signal | Action |
|--------|--------|
| `/health` | Alert on non-ok / unknown migrations |
| Client 500 messages | Should be generic; investigate server logs |
| Report 422 | User education — narrow filters; not a silent understatement |
| Queue / Redis | Confirm durability if Redis expected |

---

## Explicit non-goals

- Declaring Production Certified  
- Skipping manual actions  
- Assuming PR #136 UX fixes are live unless merged separately
