# Findings Matrix — Phase 26 (v1.4.1)

**Date:** 2026-07-21  
**Verdict:** **READY WITH CONDITIONS**  
**Production Certified:** **NOT ISSUED**

| ID | Finding | Severity | Code Fix Possible | Current Status | Evidence | Remaining Action |
|----|---------|----------|-------------------|----------------|----------|------------------|
| P26-F01 | Invitation expiry not enforced | Medium | Yes | **Closed** | `lib/invitation-expiry.ts`; auth login + accept; settings resend refreshes `invitedAt`; `invitation-expiry.test.ts` | None (monitor) |
| P26-F02 | Accept-invitation email-only (no signed token) | Medium | Yes | Open | Auth accept-invitation path still email-bound; expiry mitigates | Implement signed invite token |
| P26-F03 | Weak password policy (≥8) | Medium | Yes | **Closed** | `lib/password-policy.ts` min 10 + letter+number; FE forms; `password-policy.test.ts` | None |
| P26-F04 | Upload magic-byte gaps | Medium | Yes | **Closed** | `infrastructure/uploads/magic-bytes.ts`; `magic-bytes.test.ts` | None |
| P26-F05 | Adjustment self-approve SoD | Medium | Yes | **Closed** | `adjustments/service.ts`; `sod-self-approve.test.ts` | None |
| P26-F06 | Pool aggregates stale after adjustment approve | Medium | Yes | **Closed** | `refreshPoolAggregates` on approve | Monitor utilisation |
| P26-F07 | Loan creator can approve own loan | Medium | Yes | **Closed** | `loans/service.ts` SoD validation | None |
| P26-F08 | LOAN_CREATE idempotency unused | Medium | Yes | **Closed** | `runWithIdempotency` scope `LOAN_CREATE` | None |
| P26-F09 | getPaymentById via capped listPayments | Medium | Yes | **Closed** | `findPaymentById` in `payments/service.ts` | None |
| P26-F10 | Expenses self-post APPROVED | Medium | Yes | Open | Expense workflow (prior audit) | Maker-checker for expenses |
| P26-F11 | Regex HTML sanitizers | Medium | Yes | Open | Prior security residual | Hardened sanitizer library |
| P26-F12 | No general API rate limit | Medium | Yes | Open | Auth-limited only | Add general / gateway limits |
| P26-F13 | Report scale list-based + 422 | Medium | Yes | Open (safety present) | Reports fail-closed 422 | SQL aggregations long-term |
| P26-F14 | npm audit high vulnerabilities | Medium | Partial | Open (residual) | `npm audit --production`: 0 crit / 5 high / 4 mod / 1 low | Triage upgrades |
| P26-F15 | Authenticated non-demo smoke | High* | No (ops) | Open | No prod evidence in this pack | Operator smoke |
| P26-F16 | Backup / restore drill evidence | High* | No (ops) | Open | No PASSED evidence attached | Operator drill + RTO |
| P26-F17 | Redis for durable multi-instance queues | Medium | No (infra) | Open | In-process fallback only without `REDIS_URL` | Provision Redis + ACL |
| P26-F18 | Live FE security headers validation | Medium | No (ops) | Open | Headers in `next.config.mjs` (code) | Validate on deployed origin |

\*Operator/infrastructure blockers for **Production Certified** — not software regressions in Phase 26.

---

## Summary counts

| Status | Count |
|--------|-------|
| Closed in Phase 26 | 8 (F01, F03–F09) |
| Open code residuals | 5 (F02, F10–F13) |
| Open dependency | 1 (F14) |
| Open operator / infra | 4 (F15–F18) |

**Chosen verdict (exact):** READY WITH CONDITIONS
