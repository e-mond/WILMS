# Staging Smoke Report — Phase 27

## Status: BLOCKED / OPERATOR REQUIRED

No `DATABASE_URL`, staging base URL, or non-demo credentials were available in this cloud agent environment.

## Required operator procedure

1. Export staging API URL and a non-demo account per role
2. Run:
   ```bash
   WILMS_SMOKE_BASE_URL=https://<staging-api> \
   WILMS_SMOKE_EMAIL=<email> \
   WILMS_SMOKE_PASSWORD=<password> \
   npm run smoke:staging -w @wilms/api
   npm run smoke:rbac -w @wilms/api
   ```
3. Manually walk invite accept (token URL), expense SoD, and financial chain
4. Attach logs/screenshots to this report and re-evaluate certification
