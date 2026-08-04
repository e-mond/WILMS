# PRODUCTION CERTIFICATION REPORT — WILMS

**Certification date:** 2026-07-16  
**Candidate release line:** v1.3.7 stable (repository has no v1.3.8-rc1 artifacts)  
**Audited code:** `main @ 10dfcbb`  
**Live health evidence:** `GET https://wilms-production.up.railway.app/health`

## 1. Live production integrity gates (PASS)

Production `/health` returned:
- `data.status = "ok"`
- `data.schema.status = "ok"`
- `data.migrations.status = "ok"`
- `data.schema.missingTables = []`
- `data.migrations.latestJournalWhen` and migrations readiness reported as `ok`

This validates:
- database connectivity
- schema presence for required tables introduced across migrations
- migrations readiness without health degradation

## 2. Authenticated smoke gates (BLOCKED)

The agent environment does not have production smoke credentials. Running:
- `npm run smoke:production -w @wilms/api` fails fast with:
  `WILMS_SMOKE_EMAIL and WILMS_SMOKE_PASSWORD are required...`
- `npm run smoke:rbac -w @wilms/api` fails fast with:
  `WILMS_SMOKE_EMAIL and WILMS_SMOKE_PASSWORD are required for production RBAC smoke...`

Therefore:
- Authentication workflows (login/logout/remember-me/reset/MFA/session expiry/App lock): **NOT VERIFIED**
- RBAC per role with production accounts: **NOT VERIFIED**

## 3. Financial integrity gates (BLOCKED)

Live reconciliation audit across production data requires operational DB context and authenticated workflow execution.
This audit pass verified the financial model at the code/unit-test level, but **did not execute live reconciliation**.

## 4. Backup & disaster recovery gates (BLOCKED)

Backup/restore drill and DR recovery simulation require operator/infrastructure access not available in this environment.

## 5. Browser/mobile/a11y/performance gates (BLOCKED or PARTIAL)

Partial evidence only:
- bundle budgets and perf-budget checks: **PASS**
- Lighthouse/Core Web Vitals and WCAG 2.2 AA full audit: **NOT EXECUTED** here

## 6. Security certification gates (PARTIAL)

Evidence-based security improvements shipped in code:
- frontend XSS hardening for rich-text previews (sanitizer applied)
- elimination of remaining ESLint warning

Residual:
- dependency audit shows vulnerabilities flagged by `npm audit --production` that may require breaking upgrades

## 7. Certification verdict

**Verdict: NOT PRODUCTION CERTIFIED**  
Reason: critical gates require authenticated production execution, live reconciliation, backup/restore, DR drill, and human browser/mobile/a11y/performance validation.

