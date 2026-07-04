# RC1.4 — Version 1.0 Certification

**Status:** IN PROGRESS (release branch ready for PR)  
**Branch:** `release/rc1-4-v1-certification`  
**Verdict:** CONDITIONAL — pending production redeploy + PR merge

## Readiness score (objective)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Architecture | 8/10 | Draft/capture persistence, deploy sync gates |
| UX | 7/10 | Registration resume, capture page, status bar; notification sounds basic |
| Performance | 8/10 | Smoke 31/31, bundle budgets pass in CI |
| Security | 8/10 | CSRF/RBAC smoke green; guarantor validation live |
| Maintainability | 8/10 | Repositories + tests for new modules |
| Scalability | 7/10 | Neon-backed sessions/drafts |
| Deployment | 7/10 | `verify:deploy-sync`; Railway manual env cleanup pending |
| Documentation | 7/10 | 10 RC1.4 deliverables scaffolded |

**Overall: 7.5/10 — CONDITIONAL for v1.0 PR merge**

## STOP GATE checklist

- [x] Production smoke 31/31 (includes gitCommit + schema gates)
- [x] RBAC smoke 11/11
- [x] `/health` schema ok on live API
- [x] Registration draft auto-save + resume (`?edit=` + PATCH drafts)
- [x] Mobile photo capture page + upload endpoint
- [x] Guarantor eligibility backend (not stub)
- [x] Connection status moved to floating bar
- [x] USR-/TXN- display ID formatters
- [x] Loan pools onboarding copy
- [ ] Railway/Vercel run same commit as release branch HEAD (ops)
- [ ] Remove stale `WILMS_GIT_COMMIT` on Railway (ops)
- [ ] Full E2E matrix run documented in CI
- [ ] Notification sounds wired to login/logout events (hook added; UI toggle pending)
- [ ] All Settings dead controls removed or wired
- [ ] PR merged to `main` with CI green

## Recommendation

**CONDITIONAL CERTIFICATION** — merge `release/rc1-4-v1-certification` after CI passes and production redeploy confirms deploy sync. Do not tag `v1.0.0` until PR is merged and operator steps complete.
