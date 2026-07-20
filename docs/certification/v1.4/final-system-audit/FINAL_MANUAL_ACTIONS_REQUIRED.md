# Final Manual Actions Required — WILMS v1.4.1

**Date:** 2026-07-20  
**Audience:** Operators / Release Manager / Super Admin  
**Blocks upgrade to Production Certified:** Yes (until closed and evidenced)

These are **not** code defects in the hardening branch. They require human/ops action.

---

## Before controlled rollout

1. Confirm CI green on the release commit (`type-check`, frontend tests, `@wilms/api` tests).  
2. Ensure production `NODE_ENV=production` and **do not** set `ALLOW_DEMO_SEED=true`.  
3. Confirm no `@wilms.demo` users remain as operational accounts; use real staff identities.  
4. Set `WILMS_SMOKE_EMAIL` / `WILMS_SMOKE_PASSWORD` (non-demo) and run authenticated smoke (`npm run smoke:production` / staging equivalent).  
5. Confirm `DATABASE_URL` points at production Postgres (not in-memory; not mistaken REST wrappers).  
6. Verify `GET /health` post-deploy: DB connected, migrations not degraded, version `1.4.1`.  
7. Confirm staging deploy only when `ENABLE_STAGING_DEPLOY=true` is intentional.  
8. Validate frontend security headers on the live origin (CSP, XFO, nosniff, Referrer-Policy, Permissions-Policy).  
9. Run `npm audit` (or org scanner); triage high+ vulnerabilities.  
10. Attach backup / PITR restore drill evidence and measured RTO.  
11. Risk-accept or schedule fixes for residual Medium security items ([FINAL_SECURITY_AUDIT.md](./FINAL_SECURITY_AUDIT.md)).  
12. Visual / keyboard QA on Collector + Approver portals after deploy.  
13. If merging UX PR **#136**, re-QA login INP and mobile sidebar separately.

---

## During controlled rollout

14. Monitor 422 rates on money reports — may indicate date ranges too wide (expected fail-closed).  
15. Monitor auth failures for accidental demo-login attempts.  
16. Watch `/ops/metrics` (with token) and error logs for unhandled 500s (should be generic to clients).  
17. Keep Redis configured if durable queues are required (`REDIS_URL`).

---

## Explicitly out of scope for operators to “fix in code”

- Inventing load-test numbers  
- Declaring Production Certified without signed evidence  
- Disabling demo login guards or seeding demo users into production

---

## Sign-off table (blank)

| Role | Name | Date | Signature / ticket |
|------|------|------|--------------------|
| Release Manager | | | |
| Super Admin / Ops | | | |
| Finance (optional reconcile) | | | |
