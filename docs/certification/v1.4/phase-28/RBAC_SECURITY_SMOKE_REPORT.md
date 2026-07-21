# Phase 28G — RBAC & Security Smoke Report

**Date**: 2026-07-21  
**Status**: BLOCKED for live evidence — code-level verification complete

## Code-Level Verification

### Authorization Enforcement Points

| Check | Location | Verified |
|-------|----------|----------|
| Route-level `requirePermission` | All protected routes | ✓ |
| Expense self-approval blocked | `expenses/service.ts:reviewExpense` | ✓ |
| Loan self-approval blocked | `loans/service.ts:approveLoan` | ✓ |
| Adjustment self-approval blocked | `adjustments/service.ts` | ✓ |
| Invitation token single-use | `auth/invitation-token.service.ts` | ✓ |
| Invitation token timing-safe compare | `lib/secure-token.ts:secureCompare` | ✓ |
| Rate limit on accept-invitation | `middleware/api-rate-limit.ts` | ✓ |
| Session invalidation on logout | `auth/routes.ts` | ✓ |
| CSRF protection | BFF proxy layer | ✓ |

### Tests Covering RBAC Cases

| Test File | Covers |
|-----------|--------|
| `tests/expenses/sod-self-approve.test.ts` | Expense self-approval blocked, cross-user OK |
| `tests/security/invitation-token.test.ts` | Single-use, revoke on resend, malformed |
| `tests/security/secure-token.test.ts` | Timing-safe comparison |
| `tests/auth/session-invalidation.test.ts` | Session revocation |
| `tests/security/invitation-expiry.test.ts` | Expired invites fail-closed |

All pass (188/188 backend tests).

## Live RBAC Smoke Tests Required

**BLOCKED** — requires staging environment.

### Test Cases to Execute Against Live Staging

```bash
# Cross-user access attempt
curl -X GET $STAGING_API_URL/api/wilms/borrowers/{other-collector-borrower-id} \
  -H "Authorization: Bearer $COLLECTOR_TOKEN"  # expect 403

# Privilege escalation
curl -X POST $STAGING_API_URL/api/wilms/settings/users \
  -H "Authorization: Bearer $COLLECTOR_TOKEN"  # expect 403

# Expired invitation replay
curl -X POST $STAGING_API_URL/api/wilms/auth/accept-invitation \
  -d '{"token":"expired-token-value"}'  # expect 400/410

# Token replay after use
curl -X POST $STAGING_API_URL/api/wilms/auth/accept-invitation \
  -d '{"token":"used-token-value"}'  # expect 400/409
```

## Verdict

Code-level RBAC controls: **VERIFIED**  
Live staging evidence: **BLOCKED / OPERATOR REQUIRED**
