# RC1.2 — Release Readiness

**Git SHA:** `e456febebf509d2672ea79741b6e9a59463de10d`  
**Date:** 2026-07-02T10:30:00Z  
**Branch:** `release/rc1-1-production-stabilization`  
**Result:** READY FOR RC2 (pending blockers below)

## Tag plan

| Tag | When |
|-----|------|
| `v1.0.0` | **Only after:** merge RC1.2 docs, production redeploy, post-deploy smoke 29+11, staging DB cleanup sign-off |
| `v0.2.2` | Current production version |

## Release notes draft

Source: `CHANGELOG.md` — RC1.1 stabilization (PWA, RBAC smoke, connection status, loading policy) + RC1.2 validation evidence.

## Rollback

| Service | Action |
|---------|--------|
| Railway API | Redeploy previous deployment ID from Railway dashboard |
| Vercel frontend | Promote previous production deployment |
| Database | No pending migrations (11/11 applied) — rollback is deploy-only |

## Migration guide

- **11 migrations** (`0000`–`0010`) — all applied on production
- No pending schema changes on release branch

## Known issues (from technical debt)

| ID | Item | Blocks v1.0.0? |
|----|------|----------------|
| TD-01 | Next 14 high advisories | No |
| TD-02 | Drizzle upgrade | No |
| TD-03 | Global rate limit | No |
| TD-04 | Server-side session revocation | No |
| TD-07 | SMS/email workflow call sites | No |
| **RC1.2-DB** | Staging demo financial cleanup | **Yes** |
| **RC1.2-E2E** | Local E2E re-run (disk/CI) | **Yes** |

## Acceptance checklist (Phase 9 gates)

- [x] type-check, lint
- [x] verify:api-integrity, verify:api-coverage, verify:mock-guard
- [x] backend 40/40, frontend 431/431
- [x] build + bundle budgets
- [x] smoke:production 29/29, smoke:rbac 11/11
- [ ] test:e2e full green (blocked locally)
- [ ] staging DB cleanup verified

## Stop rule

**Do not merge/tag/deploy v1.0.0** until explicit stakeholder approval after blockers cleared.
