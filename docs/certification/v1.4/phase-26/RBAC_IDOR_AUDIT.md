# RBAC / IDOR Audit — Phase 26 (v1.4.1)

**Date:** 2026-07-21  
**Authority:** Server-side RBAC in `packages/shared-rbac` + route guards  
**Production Certified:** **NOT ISSUED**

---

## Phase 26 SoD / IDOR-adjacent closures (Verified)

| Control | Behaviour | Evidence |
|---------|-----------|----------|
| Adjustment maker-checker | Actor who requested cannot approve | `adjustments/service.ts` validation |
| Loan create/approve SoD | Creator cannot approve own loan | `loans/service.ts` validation |
| Payment GET by id | Direct `findPaymentById` + existing collector access asserts | `payments/service.ts` / routes |
| Invitation expiry | Expired INVITED users blocked at login + accept | `lib/invitation-expiry.ts`, auth routes |

Prior PR #137 collector payment GET / admin-fee-status scoping remains required and unchanged.

---

## Carry-forward (not re-broken)

| Control | Status |
|---------|--------|
| Route permission matrix + middleware | Present |
| Permission overrides API/UI | Present — backend authoritative |
| UI nav filtering display-only | By design — not a security boundary |
| Messaging / registration / approver list IDOR fixes (v1.3.8) | Assumed intact; not re-opened |
| Session revoke / `/auth/session` active assert | Present (final-system-audit) |

---

## Residual RBAC / SoD gaps

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| P26-RBAC-01 | Expenses still self-post APPROVED | Medium | Open — code |
| P26-RBAC-02 | Accept-invitation email-only (no signed token) | Medium | Open — code; expiry mitigates |
| P26-RBAC-03 | Role with both loan create + approve can still approve *others'* loans | Info | Expected — SoD is self-approval only |

---

## Testing evidence

- `src/tests/adjustments/sod-self-approve.test.ts`  
- API suite: **54 files / 176 tests PASS** (`npm run test -w @wilms/api`)  
- Broader IDOR regression coverage remains in prior security/module tests

---

## Explicit non-claims

- No claim that every historical IDOR case was re-fuzzed in Phase 26.  
- UI hiding is never sufficient authorization.

**Verdict context:** READY WITH CONDITIONS.
