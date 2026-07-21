# Final System Audit — Phase 26 (v1.4.1)

**Date:** 2026-07-21  
**Version:** 1.4.1  
**Branch:** Phase 26 closure pass  
**Prior packs:** Phase 25, UX modernisation, final-system-audit  
**Merged before this branch:** PR #132, #136, #137 → `main`  
**Verdict:** **READY WITH CONDITIONS**  
**Production Certified:** **NOT ISSUED**

---

## Purpose

Close residual Medium findings from the v1.4.1 final-system-audit with targeted code remediations. This pack documents what was fixed, what remains, and the exact release posture.

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| Invitation expiry, password policy, upload magic bytes | Statutory GL / trial balance |
| Adjustment + loan create/approve SoD | Live production smoke evidence |
| LOAN_CREATE idempotency; getPaymentById by id | Invented load-test numbers |
| Pool aggregate refresh on adjustment approve | Production Certified stamp |

---

## Code remediations (Verified in Phase 26 branch)

| Area | Fix | Evidence |
|------|-----|----------|
| Invitation expiry | `invitedAt + 7 days` on login + accept; resend refreshes `invitedAt` | `lib/invitation-expiry.ts`, auth/settings |
| Adjustment SoD | Requester cannot approve own adjustment; pool aggregates refreshed on approve | `adjustments/service.ts`, SoD tests |
| Loan SoD + idempotency | Creator cannot approve own loan; `LOAN_CREATE` via `runWithIdempotency` | `loans/service.ts` |
| Uploads | Magic-byte MIME (JPEG/PNG/WEBP/PDF) | `infrastructure/uploads/magic-bytes.ts` |
| Password policy | Min 10 + letter + number (API + FE onboarding/reset) | `lib/password-policy.ts`, auth forms |
| Payment lookup | `getPaymentById` → `findPaymentById` (no 2000-row scan) | `payments/service.ts` |

---

## Local gates (Verified)

| Gate | Result |
|------|--------|
| `npm run test -w @wilms/api` | **54 files / 176 tests PASS** |
| `npm run type-check` | PASS |
| `npm run lint` | PASS (frontend) |
| `npm run verify:migrations` | PASS (journal through `0028`) |
| `npm run verify:version` | PASS (**1.4.1**) |
| `npm audit --production` | **0 critical, 5 high, 4 moderate, 1 low** (residual — not claimed fixed) |

---

## Residual Mediums (still open)

- Accept-invitation still email-only (no signed invite token) — expiry now enforced  
- Expenses still self-post APPROVED  
- Regex HTML sanitizers  
- No general API rate limit beyond auth endpoints  
- Report scale still list-based with fail-closed 422 (SQL aggregations long-term)  
- Dependency high vulns need triage  
- Operator actions (smoke, backup drill, Redis, live headers)

See [FINDINGS_MATRIX.md](./FINDINGS_MATRIX.md) and [PRODUCTION_GAP_REPORT.md](./PRODUCTION_GAP_REPORT.md).

---

## Decision

**READY WITH CONDITIONS** for controlled operational rollout.  
**Production Certified: NOT ISSUED.**

Full readiness: [FINAL_PRODUCTION_READINESS.md](./FINAL_PRODUCTION_READINESS.md).
