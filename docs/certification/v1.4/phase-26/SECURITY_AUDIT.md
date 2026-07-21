# Security Audit — Phase 26 (v1.4.1)

**Date:** 2026-07-21  
**Baseline:** `final-system-audit/FINAL_SECURITY_AUDIT.md`  
**Production Certified:** **NOT ISSUED**

---

## Executive assessment

Phase 26 closes several Medium residuals called out in the final-system-audit (invitation expiry, password policy, upload magic bytes, adjustment SoD, loan SoD, LOAN_CREATE idempotency, payment-by-id lookup). Hardening from PR #137 (demo block, session assert, collector payment scoping, FE headers, report fail-closed) remains in force.

Remaining items are Medium / residual and require backlog work or operator risk acceptance for controlled rollout.

---

## Closed in Phase 26 (Verified)

| Prior ID | Control | Evidence |
|----------|---------|----------|
| SEC-R01 | Invitation expiry (`invitedAt + 7d`); fail-closed if missing `invitedAt`; resend refreshes | `lib/invitation-expiry.ts`; auth login + accept-invitation; settings invite/resend |
| SEC-R03 | Password policy min 10 + letter + number | `lib/password-policy.ts`; FE CompleteProfile / ResetPassword `minLength: 10` |
| SEC-R04 | Upload magic-byte MIME verification | `infrastructure/uploads/magic-bytes.ts`; `uploads/magic-bytes.test.ts` |
| SEC-R07 | Adjustment requester cannot self-approve | `adjustments/service.ts`; `sod-self-approve.test.ts` |
| SEC-R09 | `LOAN_CREATE` wrapped in `runWithIdempotency` | `loans/service.ts` |
| SEC-R10 | `getPaymentById` uses `findPaymentById` | `payments/service.ts` |
| — | Loan creator cannot approve own loan | `loans/service.ts` SoD message |

---

## Remaining findings (Medium / residual)

| ID | Finding | Status |
|----|---------|--------|
| P26-SEC-01 | Accept-invitation still email-only (no signed invite token) | Residual — expiry now enforced |
| P26-SEC-02 | Expenses can self-post as APPROVED | Residual |
| P26-SEC-03 | Regex-based HTML sanitizers (bypass classes) | Residual |
| P26-SEC-04 | No general API rate limit beyond auth endpoints | Residual |
| P26-SEC-05 | Dependency high vulns (npm audit) need triage | Residual / operator |
| P26-SEC-06 | Live FE header / CSP validation on deployed origin | Pending operator |

---

## Controls carry-forward (not re-broken)

| Control | Status |
|---------|--------|
| Demo `@wilms.demo` blocked in production | Verified (prior + still present) |
| BFF CSRF on `/api/wilms` | Present |
| Server-side RBAC (`packages/shared-rbac`) | Authoritative |
| FE CSP / XFO / nosniff / Referrer / Permissions-Policy | Present in `next.config.mjs` |
| Staging deploy gated by `ENABLE_STAGING_DEPLOY` | Present |

---

## Operator-gated

- Authenticated non-demo production/staging smoke  
- Redis ACL / private network if BullMQ required  
- `npm audit` triage (see [DEPENDENCY_REPORT.md](./DEPENDENCY_REPORT.md))  
- Live header validation on deployed FE

**Verdict context:** READY WITH CONDITIONS — not Production Certified.
