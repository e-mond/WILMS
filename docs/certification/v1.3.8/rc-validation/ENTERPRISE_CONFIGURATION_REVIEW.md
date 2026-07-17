# Enterprise Configuration Review

**Date:** 17 July 2026

## Environment & secrets

| Item | Status |
|---|---|
| `.env.example` / production examples | Present (session, DB, CORS, uploads, mail, SMS) |
| Production requires DATABASE_URL + session secret + CORS | `validate-env.ts` |
| Secret rotation runbook | Documented as gap (Phase 17) — ops |
| Feature flags | Limited; GL dual-write not yet flagged in prod |

## Security config

| Control | Status |
|---|---|
| CSRF double-submit on BFF mutations | Yes |
| Session cookie httpOnly + secure (prod) + sameSite lax | Yes |
| Helmet | Yes |
| CORS credentials + WILMS_CORS_ORIGIN | Yes |
| Trust proxy | Configurable |
| Rate limits | Login / forgot / reset / OTP — not global authenticated DoS shield |
| TLS | Platform-terminated (Vercel/Railway) |

## Jobs & backup

| Item | Status |
|---|---|
| Cron / scheduler | HTTP-triggered communications scheduler |
| Workers | in_process |
| Backup | Neon PITR docs; restore drills operator-owned |
| Log retention | Platform defaults |

## Recommendations

1. Unify Node 22 across CI/Docker/deploy  
2. Secret rotation dual-key window for sessions  
3. Authenticated rate limits on money POSTs  
4. Document logging retention per platform  

## RC stance

Configuration is **fit for the current Railway + Vercel + Neon topology**. Not a Critical blocker.
