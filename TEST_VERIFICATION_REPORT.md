# WILMS v1.1.2 — Test Verification Report

**Branch:** `hotfix/v1.1.2-user-management-notifications`  
**Version:** `1.1.2`  
**Date:** 2026-07-07  
**Environment:** CI agent workspace + production smoke (live API v1.1.1)

## Summary

All required verification commands pass. Production smoke and RBAC smoke pass against live deployment. v1.1.2 code changes are validated locally; production will reflect v1.1.2 after merge and deploy.

## Command results

| Command | Result | Details |
|---------|--------|---------|
| `npm run type-check` | ✅ PASS | Frontend + backend |
| `npm run lint` | ✅ PASS | No ESLint warnings or errors |
| `npm run build` | ✅ PASS | Next.js + API build |
| `npm run test -w @wilms/api` | ✅ PASS | 14 files, 53 tests |
| `npm run test -w @wilms/frontend` | ✅ PASS | 81 files, 223 tests |
| `npm run smoke:production` | ✅ PASS | 31/31 (live prod v1.1.1) |
| `npm run smoke:rbac` | ✅ PASS | 11/11 (live prod) |

## Backend test breakdown

| Suite | Tests |
|-------|-------|
| `loan-pools/service.test.ts` | 1 |
| `risk-flags/service.test.ts` | 4 |
| `notifications/templates.test.ts` | 6 |
| `reconciliation/service.test.ts` | 3 |
| `reports/domain.test.ts` | 4 |
| `empty-database/list-handlers.test.ts` | 7 |
| `borrowers/borrower-risk.test.ts` | 4 |
| `borrowers/guarantor-eligibility.test.ts` | 4 |
| `collector-portal/rbac.test.ts` | 6 |
| `health/health.service.test.ts` | 3 |
| `reconciliation/domain.test.ts` | 5 |
| `collector-portal/access.test.ts` | 4 |
| `reconciliation/repository.test.ts` | 1 |
| `sync/sync.constants.test.ts` | 1 |

## Frontend test highlights

| Area | Tests |
|------|-------|
| `send-test-email.test.ts` | 3 (CSRF + Gmail routing) |
| `registration.schema.test.ts` | Type of Work validation |
| `borrower-registration/*` | Wizard, schema, utils |
| Auth, layouts, utils | 200+ additional |

## Production smoke evidence

```
APP: https://wilms.vercel.app
API: https://wilms-production.up.railway.app
api-health-version: version=1.1.1
api-health-migrations: expected=14 applied=14
Passed: 31/31
```

Note: Production currently runs v1.1.1. After v1.1.2 deploy, expect migration count 15/15.

## RBAC smoke evidence

```
APP: https://wilms.vercel.app
  ✓ admin-login, admin-dashboard, admin-settings-users, admin-collectors
  ✓ collector-login, collector-own-dashboard, collector-blocked-admin (403)
  ✓ officer-login, officer-blocked-dashboard (403)
Passed: 11/11
```

## Areas covered by hotfix (manual verification post-deploy)

| Area | Automated | Manual post-deploy |
|------|-----------|-------------------|
| Test email delivery | Unit test | Admin settings → Send test email |
| User invitation email | Unit test + relay auth | Create user in settings |
| Registration officer view | RBAC smoke | Officer → My Registrations → View |
| Address field stability | Unit tests | Type in home/business address |
| Type of Work Other | Schema test | Select Other → specify field |
| Delivery logs | API route added | GET /settings/delivery-logs |
| Payment/loan notifications | Service wiring | Trigger domain events |

## Regression risk

- No changes to core loan/payment calculation logic
- RBAC additions are additive (officer read scope)
- Mail dispatch is new path; falls back to direct provider when relay not configured
- Migration `0014` is additive (new table only)

## Post-merge checklist

1. Deploy Railway API with `WILMS_VERCEL_MAIL_URL` + `WILMS_INTERNAL_MAIL_SECRET`
2. Confirm Vercel has `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `WILMS_INTERNAL_MAIL_SECRET`
3. Verify migrations 15/15 on `/health`
4. Send test email from settings
5. Create test user invitation
6. Officer login → view own registration
