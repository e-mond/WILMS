# Phase 32 — Final Operator Closure Report

**Version:** 1.4.2 | **Date:** 2026-07-22

## Executive summary

Phase 32 executed the operator evidence workflow against the actual repository and available infrastructure. **4 gates PASS**, **0 gates FAIL**, **14 gates BLOCKED**. Verdict: **READY WITH CONDITIONS**.

Production certification was **not issued** because staging/production credentials, provider delivery evidence, DR drill, load test on staging, manual QA, and human sign-offs are unavailable in this agent environment.

## Gates passed (with evidence)

| Gate | Status | Evidence |
|------|--------|----------|
| G1 Pre-flight automated verification | PASS | `evidence/verify-all-2026-07-22T09-13-01-487Z.json` |
| G5 Notification scheduler | PASS | `evidence/operator/notification-scheduler.json` (local-fallback token auth) |
| G13 Dependency decision | PASS | npm audit advisory documented |
| G14 Documentation closure | PASS | This pack + repo docs verified |

## Gates blocked (require operator)

| Gate | Owner | Missing access | Risk |
|------|-------|----------------|------|
| G2 Migration 0030 live | Operations | `STAGING_DATABASE_URL` | Schema drift |
| G3 Staging smoke + RBAC | Operations / QA | `STAGING_API_URL`, role accounts | Auth regressions |
| G4 Money-chain | Finance / Ops | Staging + isolated data | Financial workflow gaps |
| G6 Email/SMS delivery | Operations | Provider credentials | Delivery failures |
| G7 Backup/restore | Operations / DBA | Backup + isolated restore URLs | Unverified RPO/RTO |
| G8 Load test | Operations | `STAGING_API_URL` | Performance regressions |
| G9 Accessibility/browser | Product / QA | Manual browser matrix | WCAG gaps |
| G10 Production config | Operations | Hosting platform access | Misconfiguration |
| G11 Demo user purge | Security | Production DB read access | Demo auth in prod |
| G12 Incident drills | Operations | Staging + operators | Untested response |
| G15 Sign-offs (×4) | Leadership | Human approval | Cannot certify |

## Defect fixed during Phase 32

**Scheduler token routes returned 401** because Express evaluated routers with blanket `requireAuth` before scheduler endpoints. Fixed by introducing `publicSchedulerRouter` mounted before authenticated routers (`apps/backend/src/modules/scheduler/public-routes.ts`). Regression test: `scheduler-http.test.ts`.

## Exact operator commands

```bash
# Automated
npm run verify:phase32

# Staging (set credentials first)
export STAGING_API_URL=https://<staging-host>
export STAGING_ADMIN_EMAIL=...
export STAGING_ADMIN_PASSWORD=...
bash scripts/operator/run-staging-gates.sh

# Migration 0030
DATABASE_URL=$STAGING_DATABASE_URL npm run db:migrate -w @wilms/api

# Scheduler (staging)
export WILMS_API_BASE_URL=$STAGING_API_URL
export WILMS_SCHEDULER_TOKEN=...
bash scripts/operator/run-notification-scheduler-gate.sh

# DR drill
WILMS_BACKUP_DATABASE_URL=... WILMS_RESTORE_DATABASE_URL=... npm run drill:backup-restore
```

## Final verdict

**READY WITH CONDITIONS** — all code-level gates pass; operator evidence collection remains.
