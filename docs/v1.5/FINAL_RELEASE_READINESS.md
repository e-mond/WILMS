# Final Release Readiness — v1.5.0

## Definition of Done checklist

| Criterion | Status |
|---|---|
| Railway not required for production | Met (optional rollback only) |
| Standalone Express process not required | Met |
| APIs served via Next Route Handlers | Met (`/api/wilms/[...path]`) |
| Vercel deploys UI + API together | Met |
| Vercel Cron runs notification scheduler | Met (`/api/cron/notifications`) |
| Financial / RBAC / notification domain preserved | Met (transport-only change) |
| Migration history preserved | Met |
| Docs + reports updated | Met |
| Version 1.5.0 consistent across packages | Met |

## Human review checkpoints

1. Phase B transport — sign off Preview financial/RBAC/notification suites  
2. Phase E cron — sign off one successful Vercel Cron (or manual GET with token)  
3. Final DoD — sign off before merge to `main`

## Parallel validation window

1. Keep `main` on v1.4.3 (Railway + Vercel BFF) as rollback.  
2. Deploy Preview/Production candidate from `v1.5-platform-consolidation` against the **same Neon**.  
3. Compare health version, sample financial reads, and scheduler dry-run.  
4. Optionally set `WILMS_API_MODE=proxy` on a Preview to A/B against Railway.

## Cutover

1. Promote Vercel Production build for v1.5.0.  
2. Confirm `/api/wilms/health` shows `1.5.0`.  
3. Confirm Cron configuration active; disable GHA schedule (already disabled).  
4. Scale down Railway service only after sign-off.

## Rollback

1. Revert Vercel Production to last v1.4.3 deployment **or** redeploy `main`.  
2. Re-enable Railway service if stopped.  
3. Set frontend `WILMS_API_MODE=proxy` + `WILMS_API_UPSTREAM` to Railway if a mixed rollback is required.  
4. Re-enable GHA scheduler schedule if Vercel Cron must be abandoned.

## Residual risks

- Express remains as internal router (not a separate process); peel to native handlers over time.  
- Connection exhaustion if non-pooled Neon URL is used.  
- Redis must be provisioned on Vercel for correct rate limiting.
