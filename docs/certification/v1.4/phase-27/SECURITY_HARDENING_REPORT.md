# Security Hardening Report — Phase 27

## Closed this phase

- Signed invite tokens (hash storage, single-use, revoke, audit, rate limit)
- Expense SoD
- Global API rate limiting
- Collector invite expiry field + token email

## Carry-forward (still sound)

- Demo login blocked in production
- Session assert on `/auth/session`
- CSRF via BFF
- Upload magic bytes
- Password policy 10+ letter/number
- Adjustment/loan SoD

## Errors

User-facing AppError messages; raw DB/stack not returned on 500 paths (Phase 26).
