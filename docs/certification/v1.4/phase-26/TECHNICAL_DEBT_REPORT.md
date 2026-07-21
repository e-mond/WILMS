# Technical Debt Report — Phase 26 (v1.4.1)

**Date:** 2026-07-21  
**Verdict:** **READY WITH CONDITIONS**  
**Production Certified:** **NOT ISSUED**

---

## Closed this phase (debt retired)

| Debt | Resolution |
|------|------------|
| Invitation expiry not enforced | `invitedAt + 7 days` + resend refresh |
| Weak password (≥8) | Min 10 + letter + number |
| Upload MIME trust gaps | Magic-byte detect JPEG/PNG/WEBP/PDF |
| Adjustment self-approve | Maker-checker SoD |
| Loan self-approve | Creator ≠ approver |
| Unused `LOAN_CREATE` idempotency | Wrapped in `runWithIdempotency` |
| `getPaymentById` list scan | `findPaymentById` |
| Stale pool aggregates after adjustment approve | `refreshPoolAggregates` |

---

## Open debt (prioritised)

| ID | Item | Bucket | Severity |
|----|------|--------|----------|
| P26-TD-01 | Signed invitation tokens (not email-only accept) | code | Medium |
| P26-TD-02 | Expense maker-checker (no self-post APPROVED) | code | Medium |
| P26-TD-03 | Replace regex HTML sanitizers with hardened library | code | Medium |
| P26-TD-04 | General API rate limiting (beyond auth) | code / infra | Medium |
| P26-TD-05 | SQL-backed report aggregations (retire list+422 as sole scale path) | code | Medium |
| P26-TD-06 | npm audit high vulnerability triage / upgrades | code / operator | Medium |
| P26-TD-07 | Broader cursor pagination beyond borrowers | code | Low–Medium |
| P26-TD-08 | Statutory GL dual-write / double-entry | roadmap | — (v1.5+) |

---

## Intentional deferrals

- Fortune-500 / enterprise GL certification  
- Full OpenTelemetry collector export  
- Marketing “Production Certified” claims

---

## Guidance

Controlled rollout may proceed with documented risk acceptance on Medium residuals. Broad unsupervised exposure should wait for rate limits, invite tokens, and dependency triage at minimum.

See [FINDINGS_MATRIX.md](./FINDINGS_MATRIX.md).
