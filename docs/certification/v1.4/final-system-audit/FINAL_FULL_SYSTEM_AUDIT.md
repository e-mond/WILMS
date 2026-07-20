# WILMS Final Full-System Audit — v1.4.1

**Date:** 2026-07-20  
**Version under review:** 1.4.1  
**Author:** WILMS Engineering  
**Pack:** [`docs/certification/v1.4/final-system-audit/`](./)  
**Index:** [`docs/FINAL_AUDIT_INDEX.md`](../../../FINAL_AUDIT_INDEX.md)

---

## Verdict

# READY WITH CONDITIONS

WILMS v1.4.1 is a **controlled operational rollout candidate** after the hardening fixes in this audit branch.  
**Production Certified: NOT ISSUED.** Do not market or document this release as production-certified.

Software track: hardening regressions addressed and unit-covered where listed below.  
Operator track: open — see [`FINAL_MANUAL_ACTIONS_REQUIRED.md`](./FINAL_MANUAL_ACTIONS_REQUIRED.md).

---

## What was fixed (this audit branch)

| # | Fix | Evidence |
|---|-----|----------|
| 1 | Demo users not seeded in production; login rejects `@wilms.demo` in production | `apps/backend/src/lib/demo-accounts.ts`, seed + auth login; `tests/security/demo-login-block.test.ts` — **Verified** |
| 2 | Unhandled API errors no longer echo raw `Error.message` | `apps/backend/src/http/error-handler.ts` — **Verified** |
| 3 | `/auth/session` calls `assertSessionActive` (revoked/suspended → unauthenticated) | `apps/backend/src/modules/auth/routes.ts` — **Verified** |
| 4 | Payment GET IDOR: payment-entry, same-day, payment-by-id require borrower assignment for collectors; admin-fee-status scoped | `apps/backend/src/modules/payments/routes.ts`, borrowers routes; hardening regression tests — **Verified** |
| 5 | Money reports refuse silently truncated 2000-row lists (422 + clear message) for daily-collection, defaulters, financial-ledger | `apps/backend/src/modules/reports/routes.ts` — **Verified** |
| 6 | Frontend security headers (CSP, XFO, nosniff, Referrer-Policy, Permissions-Policy) | `apps/frontend/next.config.mjs` — **Verified** |
| 7 | Deploy staging/production workflows Node 20 → 22 to match engines/CI | `.github/workflows/deploy-*.yml`, root `engines.node >=22` — **Verified** |

**Related (not in this branch):** UX PR **#136** — login password INP fix; mobile sidebar `forceExpanded` when desktop collapsed. Track separately.

---

## Evidence legend

| Label | Meaning |
|-------|---------|
| **Verified** | Confirmed in this branch’s code and/or automated tests |
| **Pending operator** | Requires live credentials, deploy, or signed ops action |
| **Not verified** | No live load test / production evidence in this pack |

---

## 10-point final summary

1. **Verdict:** READY WITH CONDITIONS — controlled rollout candidate; **not** Production Certified.  
2. **Hardening:** Seven production-safety fixes landed in this branch (demo login/seed, error leakage, session assert, payment IDOR, report truncation, FE headers, Node 22 deploy). **Verified.**  
3. **Security residual (Medium):** invitation expiry not enforced; accept-invitation email-only; weak password policy (≥8); upload magic-byte gaps; regex sanitizers; no general API rate limit; adjustment self-approve SoD; expenses self-post APPROVED; `LOAN_CREATE` idempotency unused; `getPaymentById` still uses capped `listPayments`; some `notify*` templates unwired. Documented in [`FINAL_SECURITY_AUDIT.md`](./FINAL_SECURITY_AUDIT.md).  
4. **Financial:** Conditional pass — admin fee, pool hard stop, payment immutability, GPS, reversal unwind, SQL dashboard KPIs **Verified**. Residual: report scale needs SQL aggregations long-term; adjustment/pool refresh gap; maker-checker gaps. See [`FINAL_FINANCIAL_INTEGRITY_AUDIT.md`](./FINAL_FINANCIAL_INTEGRITY_AUDIT.md).  
5. **Database / CI:** 29 migrations journal OK; health soft-fails on drift; Node 22 aligned; staging gated by `ENABLE_STAGING_DEPLOY`. **Verified** in repo. Live watermark / restore drill — **Pending operator**.  
6. **Performance:** No live load-test evidence in repo (**Not verified**). Report 422 guard reduces silent understatement risk; long-term SQL aggregations still required.  
7. **Accessibility / UI-UX:** Prior UX modernisation carry-forward; PR #136 related. Full WCAG certification **Not verified**. See accessibility and UI/UX audits.  
8. **Error handling / deps / dead code:** Generic 500 messages **Verified**; dependency CVE refresh and dead-code cleanup are residual hygiene, not rollout blockers if ops follows [`FINAL_MANUAL_ACTIONS_REQUIRED.md`](./FINAL_MANUAL_ACTIONS_REQUIRED.md).  
9. **Conditions:** Operators must complete manual actions before broad go-live; production certificate remains **NOT ISSUED**.  
10. **Release decision:** Exactly **READY WITH CONDITIONS** — see [`FINAL_RELEASE_DECISION.md`](./FINAL_RELEASE_DECISION.md) and [`FINAL_PRODUCTION_READINESS.md`](./FINAL_PRODUCTION_READINESS.md).

---

## Pack contents

| Document | Path |
|----------|------|
| Code | [FINAL_CODE_AUDIT.md](./FINAL_CODE_AUDIT.md) |
| Security | [FINAL_SECURITY_AUDIT.md](./FINAL_SECURITY_AUDIT.md) |
| Financial | [FINAL_FINANCIAL_INTEGRITY_AUDIT.md](./FINAL_FINANCIAL_INTEGRITY_AUDIT.md) |
| Database | [FINAL_DATABASE_AUDIT.md](./FINAL_DATABASE_AUDIT.md) |
| Performance | [FINAL_PERFORMANCE_AUDIT.md](./FINAL_PERFORMANCE_AUDIT.md) |
| Accessibility | [FINAL_ACCESSIBILITY_AUDIT.md](./FINAL_ACCESSIBILITY_AUDIT.md) |
| UI / UX | [FINAL_UI_UX_AUDIT.md](./FINAL_UI_UX_AUDIT.md) |
| Error handling | [FINAL_ERROR_HANDLING_AUDIT.md](./FINAL_ERROR_HANDLING_AUDIT.md) |
| Dependencies | [FINAL_DEPENDENCY_AUDIT.md](./FINAL_DEPENDENCY_AUDIT.md) |
| Documentation | [FINAL_DOCUMENTATION_AUDIT.md](./FINAL_DOCUMENTATION_AUDIT.md) |
| Dead code | [FINAL_DEAD_CODE_AUDIT.md](./FINAL_DEAD_CODE_AUDIT.md) |
| Production readiness | [FINAL_PRODUCTION_READINESS.md](./FINAL_PRODUCTION_READINESS.md) |
| Manual actions | [FINAL_MANUAL_ACTIONS_REQUIRED.md](./FINAL_MANUAL_ACTIONS_REQUIRED.md) |
| Release decision | [FINAL_RELEASE_DECISION.md](./FINAL_RELEASE_DECISION.md) |

## Related packs

- UX modernisation: [`../ux-modernisation/FULL_AUDIT_INDEX.md`](../ux-modernisation/FULL_AUDIT_INDEX.md)  
- Phase 25 platform: [`../phase-25/INDEX.md`](../phase-25/INDEX.md)  
- Ops runbooks: [`docs/PRODUCTION_ROLLOUT_RUNBOOK.md`](../../../PRODUCTION_ROLLOUT_RUNBOOK.md), [`docs/TROUBLESHOOTING.md`](../../../TROUBLESHOOTING.md)
