# Final Code Audit — WILMS v1.4.1

**Date:** 2026-07-20  
**Scope:** Hardening delta in this audit branch + carry-forward platform posture  
**Verdict context:** [FINAL_FULL_SYSTEM_AUDIT.md](./FINAL_FULL_SYSTEM_AUDIT.md) — READY WITH CONDITIONS

---

## Summary

Code changes in this branch are **targeted hardening**, not a feature rewrite. Review focused on auth/demo boundaries, error surfaces, collector payment scoping, money-report safety, frontend headers, and CI Node alignment.

| Area | Status | Notes |
|------|--------|-------|
| Demo account production guard | **Verified** | `demo-accounts.ts` + seed gate + login assert |
| Session activity on `/auth/session` | **Verified** | `assertSessionActive` |
| Payment collector scoping | **Verified** | `assertCollectorPaymentAccess` on GET paths |
| Report truncation refusal | **Verified** | 422 when list would understate totals |
| FE security headers | **Verified** | `next.config.mjs` |
| Deploy Node version | **Verified** | workflows use Node 22 |
| Broad refactor / dead-code purge | Out of scope | See [FINAL_DEAD_CODE_AUDIT.md](./FINAL_DEAD_CODE_AUDIT.md) |

---

## Architecture posture (carry-forward)

| Layer | Layout | Status |
|-------|--------|--------|
| Frontend | Next.js 14 `@wilms/frontend`, BFF `/api/wilms/[...path]` | Unchanged pattern — **Verified** in repo |
| Backend | Express `@wilms/api`, modules under `apps/backend/src/modules` | Unchanged pattern |
| Shared | `packages/shared-*` contracts, RBAC, validation | Authoritative for permissions |
| Data | Drizzle + Postgres when `DATABASE_URL` set; in-memory otherwise | Dev default documented in `AGENTS.md` |

Cross-ref: [`docs/ARCHITECTURE.md`](../../../ARCHITECTURE.md).

---

## Quality gates (repo expectations)

| Gate | Expectation | This pack |
|------|-------------|-----------|
| `npm run type-check` | Frontend + API | **Pending operator** / CI green on merge |
| `npm run test` | Frontend | Run on PR CI |
| `npm run test -w @wilms/api` | Includes security hardening tests | Local evidence: demo-login + hardening-regressions present |
| Live production smoke | Auth + money chain | **Pending operator** — no fake evidence |

---

## Residual code risks (accepted for controlled rollout)

1. `getPaymentById` still resolves via capped `listPayments` in one path — correctness under large datasets residual ([FINAL_SECURITY_AUDIT.md](./FINAL_SECURITY_AUDIT.md)).  
2. Some money report paths still load full lists before counting — 422 guard mitigates silent truncation; SQL aggregations remain the long-term fix.  
3. `LOAN_CREATE` idempotency key surface exists but is unused in call sites — Phase 25 carry-forward.  
4. Related UX PR #136 not merged in this branch — track separately.

---

## Explicit non-claims

- No claim of full codebase clean-room audit.  
- No Production Certified stamp.  
- No assertion that all technical debt is closed.
