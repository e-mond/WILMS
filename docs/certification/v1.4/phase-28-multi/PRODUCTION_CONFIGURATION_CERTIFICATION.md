# Production Configuration Certification

**Version:** 1.4.2 | **Date:** 2026-07-21

## Code-Level (PASS)

- No secrets in Git
- Production fails without WILMS_SESSION_SECRET
- CSRF, CORS, rate limits configured in code
- Demo users seed-guarded

## Operator Verification (BLOCKED)

| Item | Required |
|------|----------|
| JWT/session secret strength | Secrets manager |
| DATABASE_URL SSL | Ops |
| REDIS_URL for multi-instance | Ops |
| Mail/SMS providers | Ops |
| Cloudinary credentials | Ops |
| Demo purge in production DB | SQL verification |
| Feature flags in prod | Env review |

```sql
-- Demo purge check
SELECT id, email FROM users WHERE email LIKE '%@wilms.demo';
-- Expected: 0 rows
```

## Status

Code config **PASS** | Production secrets **BLOCKED**
