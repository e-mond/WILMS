# Final Security Audit — WILMS v1.4.1

**Date:** 2026-07-20  
**Baseline:** Phase 25 `V1.4_SECURITY_REVIEW.md`, UX modernisation security delta, this branch hardening  
**Production Certified:** **NOT ISSUED**

---

## Executive assessment

Hardening in this branch closes several **High-impact operational gaps** (demo production login/seed, error message leakage, inactive session on `/auth/session`, collector payment GET IDOR, silent money-report truncation, FE security headers, Node 22 deploy alignment).  

Remaining items below are **Medium / residual** — document for backlog and risk acceptance during controlled rollout. They are **not invented**; they are carried from prior reviews and confirmed still relevant.

---

## Fixed in this branch (Verified)

| Control | Evidence |
|---------|----------|
| Demo seed off in production; `@wilms.demo` login blocked | `apps/backend/src/lib/demo-accounts.ts`, auth login, seed; `demo-login-block.test.ts` |
| No raw `Error.message` on unhandled 500 | `http/error-handler.ts` → generic client message; server logs retain detail |
| `/auth/session` enforces active session | `assertSessionActive` in auth routes |
| Collector payment GET IDOR + admin-fee-status scope | `payments/routes.ts` `assertCollectorPaymentAccess`; borrowers admin-fee-status |
| Money reports refuse truncated totals | `reports/routes.ts` → 422 with clear message |
| FE CSP / XFO / nosniff / Referrer-Policy / Permissions-Policy | `apps/frontend/next.config.mjs` |
| Deploy workflows Node 22 | `.github/workflows/deploy-staging.yml`, `deploy-production.yml` |

---

## Remaining findings (Medium / residual)

| ID | Finding | Status |
|----|---------|--------|
| SEC-R01 | Invitation expiry not enforced | Residual |
| SEC-R02 | Accept-invitation is email-only (weak binding) | Residual |
| SEC-R03 | Weak password policy (≥8 characters) | Residual |
| SEC-R04 | Upload magic-byte validation gaps | Residual |
| SEC-R05 | Regex-based sanitizers (bypass classes) | Residual |
| SEC-R06 | No general API rate limit | Residual |
| SEC-R07 | Adjustment self-approve SoD gap | Residual — also financial |
| SEC-R08 | Expenses can self-post as APPROVED | Residual — also financial |
| SEC-R09 | `LOAN_CREATE` idempotency unused | Residual |
| SEC-R10 | `getPaymentById` still uses capped `listPayments` | Residual |
| SEC-R11 | Some `notify*` templates unwired | Residual / hygiene |

---

## Controls carry-forward (not re-broken)

| Control | Status |
|---------|--------|
| BFF CSRF on `/api/wilms` | Present — **Verified** in architecture |
| Server-side RBAC (`packages/shared-rbac`) | Authoritative — UI must not be sole control |
| Authenticate middleware + session revoke path | Present |
| Staging deploy gated by `ENABLE_STAGING_DEPLOY` | **Verified** in workflow |

---

## Operator-gated

| Item | Status |
|------|--------|
| Authenticated production smoke (non-demo) | **Pending operator** |
| Redis ACL / private network for BullMQ | **Pending operator** |
| `npm audit` triage on release | **Pending operator** |
| Live header / CSP validation in deployed FE | **Pending operator** |

---

## Related

- [FINAL_FINANCIAL_INTEGRITY_AUDIT.md](./FINAL_FINANCIAL_INTEGRITY_AUDIT.md) — SoD / money controls  
- [FINAL_ERROR_HANDLING_AUDIT.md](./FINAL_ERROR_HANDLING_AUDIT.md) — client error disclosure  
- [docs/PERMISSIONS_AND_ROLES.md](../../../PERMISSIONS_AND_ROLES.md)
