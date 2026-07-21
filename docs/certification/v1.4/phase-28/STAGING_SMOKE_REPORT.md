# Phase 28E — Authenticated Staging Smoke Report

**Date**: 2026-07-21  
**Status**: BLOCKED — no staging credentials available

## Reason

This gate requires real non-demo staging credentials and a live staging environment. No `STAGING_API_URL`, `STAGING_ADMIN_EMAIL`, `STAGING_ADMIN_PASSWORD` or equivalent environment variables were provided.

## Required Environment Variables

```bash
STAGING_API_URL=https://staging.wilms.example.com
STAGING_ADMIN_EMAIL=<real-admin@your-domain.com>
STAGING_ADMIN_PASSWORD=<real-password>
STAGING_COLLECTOR_EMAIL=<collector@your-domain.com>
STAGING_COLLECTOR_PASSWORD=<password>
STAGING_OFFICER_EMAIL=<officer@your-domain.com>
STAGING_OFFICER_PASSWORD=<password>
STAGING_APPROVER_EMAIL=<approver@your-domain.com>
STAGING_APPROVER_PASSWORD=<password>
STAGING_AUDITOR_EMAIL=<auditor@your-domain.com>
STAGING_AUDITOR_PASSWORD=<password>
```

## Test Cases to Execute

For each role, execute and record HTTP status codes and response bodies:

```bash
# Login
curl -X POST $STAGING_API_URL/api/wilms/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"$STAGING_ADMIN_EMAIL","password":"$STAGING_ADMIN_PASSWORD"}'

# Logout
curl -X POST $STAGING_API_URL/api/wilms/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Session revocation
curl -X DELETE $STAGING_API_URL/api/wilms/auth/sessions \
  -H "Authorization: Bearer $TOKEN"

# Role-restricted route (Auditor must not access settings)
curl -X GET $STAGING_API_URL/api/wilms/settings/users \
  -H "Authorization: Bearer $AUDITOR_TOKEN"  # expect 403

# Invitation flow
# 1. Admin creates user → invitation email sent with signed token
# 2. Follow invite link → verify token consumed
# 3. Attempt replay → verify 409/400 returned
# 4. Resend → verify old token revoked
```

## Expected Evidence Artifact

For each test case, capture:
- HTTP status code
- Response body (with PII redacted)
- Timestamp
- Actor role

Save as `STAGING_SMOKE_EVIDENCE.txt` or equivalent.

## Verdict

**BLOCKED / OPERATOR REQUIRED**  
Gate cannot be passed without staging credentials and environment.
