# Manual Actions Required — Phase 26 (v1.4.1)

**Date:** 2026-07-21  
**Audience:** Operators / Release Manager / Super Admin  
**Blocks upgrade to Production Certified:** Yes (until closed and evidenced)

These are **not** Phase 26 code defects. Human/ops action required.

---

## Before controlled rollout

1. Confirm CI green on the release commit (`type-check`, frontend tests, `@wilms/api` tests — locally **176** API tests PASS).  
2. Ensure production `NODE_ENV=production` and **do not** set `ALLOW_DEMO_SEED=true`.  
3. Confirm no `@wilms.demo` operational accounts; use real staff identities.  
4. Set `WILMS_SMOKE_EMAIL` / `WILMS_SMOKE_PASSWORD` (non-demo) and run authenticated smoke.  
5. Confirm `DATABASE_URL` is production Postgres; verify `GET /health` (DB connected, migrations healthy, version `1.4.1`).  
6. Enable staging deploy only when `ENABLE_STAGING_DEPLOY=true` is intentional.  
7. Validate live FE security headers (CSP, XFO, nosniff, Referrer-Policy, Permissions-Policy).  
8. Run `npm audit --production` (or org scanner); triage **high+** (current residual: 5 high / 4 moderate / 1 low).  
9. Attach backup / PITR restore drill evidence and measured RTO.  
10. Risk-accept or schedule fixes for residual Mediums ([FINDINGS_MATRIX.md](./FINDINGS_MATRIX.md)).  
11. Visual / keyboard QA on Collector + Approver portals after deploy.  
12. If Redis durability required, provision `REDIS_URL` with ACL / private network.

---

## During controlled rollout

13. Monitor money-report **422** rates (wide date ranges — expected fail-closed).  
14. Monitor auth failures for expired invitations and demo-login attempts.  
15. Watch adjustment/loan SoD validation rates (self-approve should be rare and rejected).  
16. Watch `/ops/metrics` and error logs (client 500s should remain generic).

---

## Explicitly out of scope for operators to “fix in code”

- Inventing load-test numbers  
- Declaring Production Certified without signed evidence  
- Disabling invitation expiry, SoD checks, or demo login guards

---

## Sign-off table (blank)

| Role | Name | Date | Signature / ticket |
|------|------|------|--------------------|
| Release Manager | | | |
| Super Admin / Ops | | | |
| Finance (optional reconcile) | | | |
