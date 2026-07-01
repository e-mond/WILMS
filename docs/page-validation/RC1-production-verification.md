# RC1 Production Verification — Phase 2

**Date:** 2026-07-01

## Pre-merge gates

| Gate | Result |
|------|--------|
| `npm run type-check` | PASS |
| `npm run verify:api-integrity` | 135/135 PASS |
| `npm run verify:api-coverage` | 0 placeholders PASS |
| Backend tests | 21/21 PASS |
| Frontend tests | Run in CI |

## Post-merge smoke

```bash
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
npm run smoke:production
```

Extended checks: settings/me, dashboard, groups, loan-pools, risk-flags, messages, collectors.

## Migration

Apply `0010_messages.sql` on Railway deploy.

## Manual verification

- [ ] Login all 5 roles
- [ ] Create group, pool, collector via modals
- [ ] Flag group, raise/resolve risk flag
- [ ] Send collector message
- [ ] Settings SMS/email test buttons

## Verdict

**READY** for PR merge pending CI green.
