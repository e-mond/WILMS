# FINAL_RELEASE_READINESS.md

**Candidate:** WILMS v1.3.8  
**Date:** 2026-07-17  
**Feature freeze:** Permanent for this line

## Readiness Statement

The **code repository** is ready for release engineering: zero-defect cleanup complete, critical/high app security issues closed, local gates green.

The **deployed production system** is **not** certified until external blockers clear.

## In-Repo Ready

- [x] Dead code / unused assets removed
- [x] Security high/critical app defects closed
- [x] Accessibility dialog blockers fixed
- [x] Error boundaries friendly
- [x] Docs/version aligned to 1.3.8
- [x] type-check, lint, build, unit tests pass
- [x] verify scripts pass

## External Blockers (not code defects)

| Blocker | Class | Owner action |
|---|---|---|
| Deploy v1.3.8 to Railway + Vercel | Deployment | Merge PRs + deploy; `/health.version=1.3.8` |
| `WILMS_SMOKE_EMAIL` / `WILMS_SMOKE_PASSWORD` | Credentials | Run smoke:production + smoke:rbac |
| Staging Neon stress / concurrency certs | Infrastructure | Run cert:* scripts with DATABASE_URL |
| Neon backup/restore evidence | Production Operations | Ops runbook |
| Monitoring/alerting proof | Production Operations | Ops |
| npm audit breaking upgrades | External Service | Separate upgrade PR |
| Full WCAG AT/Lighthouse sign-off | Production Operations | QA |

## Go / No-Go

| Question | Answer |
|---|---|
| Merge zero-defect + hardening/cert branches? | **GO** for staging |
| Tag `v1.3.8-production-certified`? | **NO-GO** until external blockers cleared |
| Start feature work? | **NO** — freeze holds |

## Related Reports

All `FINAL_*` zero-defect and certification reports at repository root.
