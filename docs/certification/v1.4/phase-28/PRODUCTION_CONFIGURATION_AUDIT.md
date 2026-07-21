# Phase 28J — Production Configuration Audit

**Date**: 2026-07-21  
**Status**: Partial — code-level complete; operator verification required for secrets

## Code-Level Verification

### Secrets — None Committed

```bash
git log --all --full-history -- "*.env" "*.env.*" | head -5
# Result: no .env files tracked
```

All secret-bearing files are in `.gitignore`. Verified:
- `apps/frontend/.env.local` — gitignored ✓
- `apps/backend/.env` — gitignored ✓
- No `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, or SMTP credentials in any committed file

### CORS

Configured in `apps/backend/src/http/app.ts`. Origin whitelist derived from `CORS_ORIGIN` environment variable. Falls back to `localhost:3000` in development. ✓

### CSRF

BFF proxy at `apps/frontend/src/app/api/wilms/[...path]/route.ts` enforces CSRF token validation for all mutating methods. ✓

### Rate Limiting

- Global: 300 requests/minute/IP (in-memory store; Redis store when `REDIS_URL` set)
- Invitation abuse: 10 requests/15 minutes/IP
- Source: `apps/backend/src/middleware/api-rate-limit.ts` ✓

### Health Check

`GET /health` — excluded from rate limiting, returns `{ status: "ok", version }` ✓

### Metrics Authentication

`GET /metrics` — guarded by `requirePermission(PERMISSION.VIEW_METRICS)` ✓

## Operator-Required Verifications

| Item | Requirement | Status |
|------|-------------|--------|
| `JWT_SECRET` | Min 64 chars, random, not default | BLOCKED — verify in secrets manager |
| `DATABASE_URL` | Points to production DB, SSL required | BLOCKED |
| `REDIS_URL` | Set for multi-instance rate limiting | BLOCKED |
| Mail provider | `SMTP_HOST` / SendGrid API key configured | BLOCKED |
| Cloudinary / storage | `CLOUDINARY_URL` configured | BLOCKED |
| Feature flags | `FEATURE_*` env vars reviewed | BLOCKED |
| Demo user purge | Seed users purged from production DB | BLOCKED |
| Backup policy | Automated daily backups configured | BLOCKED |
| Monitoring | APM / error tracking configured | BLOCKED |
| SSL/TLS | All endpoints served over HTTPS | BLOCKED |

## Demo User Purge

Demo accounts are defined only in `apps/backend/src/seed/demo-users.ts`. They are seeded only when `NODE_ENV !== 'production'` OR explicitly invoked. Operators must verify these accounts are not present in the production database:

```sql
SELECT id, email FROM users WHERE email LIKE '%@wilms.demo';
-- Expected: 0 rows
```

## Verdict

Code-level configuration: **VERIFIED**  
Production secrets and infrastructure: **BLOCKED / OPERATOR REQUIRED**
