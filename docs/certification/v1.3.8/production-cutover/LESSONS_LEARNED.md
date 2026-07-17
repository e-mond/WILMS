# Lessons Learned — WILMS v1.3.8 Production Cutover (Phase 23)

**Date:** 17 July 2026  
**Phase:** 23  
**Audience:** Release Manager, SRE, Engineering, Operations

---

## What went well

| Area | Observation |
|------|-------------|
| Deploy sync | Production `/health` confirms `version: 1.3.8` and Phase 22 merge SHA — cutover deploy objective met |
| Public probe automation | Repeatable curl probes produced consistent evidence (health, headers, latency) without credentials |
| Fail-closed smoke | `smoke:production` correctly refuses to run without `WILMS_SMOKE_*` — demo accounts disabled on live |
| Security baseline | HSTS, CSP, CORS restriction, and anonymous metrics 401 verified in one session |
| Evidence discipline | Credential audit file explicitly records UNSET vars — no fabricated operator artifacts |
| Track separation | Software track (Phases 21–22) vs operator track clearly separable in gate tables |

---

## What blocked closure

| Gap | Root cause | Impact |
|-----|------------|--------|
| Authenticated smoke | `WILMS_SMOKE_EMAIL/PASSWORD` unset | Cannot prove live money-chain or RBAC |
| Financial reconcile | `DATABASE_URL` unset | Cannot verify balances on prod data |
| Neon restore drill | `NEON_API_KEY` unset + no console session | No DR evidence |
| Metrics scrape | `WILMS_METRICS_TOKEN` unset | Observability closure blocked |
| Human sign-offs | No stakeholder session | Certificate cannot be issued |
| Tag / maintenance branch | Certification incomplete | Correctly deferred |

---

## Process improvements

| # | Lesson | Recommendation |
|---|--------|----------------|
| 1 | Operator secrets are the long pole | Provision smoke + metrics + read-only DB credentials **before** cutover documentation sprint |
| 2 | Two-track certification reduces confusion | Always report Software **CLOSED** and Operator **OPEN** separately |
| 3 | Public probes ≠ full certification | Health 200 is necessary but not sufficient — document explicitly |
| 4 | Evidence filenames need timestamps | Continue `YYYYMMDDTHHMMSSZ` pattern under `evidence/` |
| 5 | Migration countGap needs standing acceptance | Document watermark authority vs row-count in every phase |
| 6 | Certificate/tag/branch are post-conditions | Never create `v1.3.8-production-certified` or maintenance branch until checklist complete |

---

## Technical observations

| Topic | Detail |
|-------|--------|
| Workers | `in_process` queue + `http_triggered` scheduler — ops must externalize cron and accept restart risk |
| Latency | Single-sample baselines (~0.31s health) — not load-tested; track for regression only |
| Integrations | Health reports configured=true — live delivery tests still Pending |
| Frontend cache | `cache-control: private, no-cache` on `/login` — appropriate for auth surfaces |

---

## Risks accepted for cutover (with conditions)

| Risk | Mitigation path |
|------|-----------------|
| No live money-chain proof | Run `smoke:production` with prod credentials |
| No DR drill | Execute Neon PITR restore per [BACKUP_RESTORE_EVIDENCE.md](./BACKUP_RESTORE_EVIDENCE.md) |
| No metrics scrape | Set `WILMS_METRICS_TOKEN`, configure Prometheus |
| No alert proof | Fire test alert per [POST_DEPLOYMENT_MONITORING_PLAN.md](./POST_DEPLOYMENT_MONITORING_PLAN.md) |

---

## Carry forward to operator closure

1. Attach smoke logs for production and RBAC.
2. Run financial reconcile with read-only `DATABASE_URL`.
3. Complete Neon restore drill with measured RTO.
4. Collect all stakeholder signatures.
5. Issue certificate, then execute [MAINTENANCE_BRANCH_PLAN.md](./MAINTENANCE_BRANCH_PLAN.md).

**Phase 23 verdict:** **⚠ READY WITH CONDITIONS** — deploy succeeded; operator track remains the gating work.
