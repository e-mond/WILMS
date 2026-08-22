# WILMS v1.8.1 — Bug register (audit branch)

**Branch:** `audit/v1.8.1-final-system-audit`  
**Date:** 17 August 2026  
**Merge policy:** Do not merge until owner reviews this register  

---

## Fixed on audit branch (awaiting review)

### V181-001 — Loan approve blocked until admin fee paid (UI)

| Field | Value |
|-------|-------|
| Severity | P1 |
| Role | Super Admin |
| Route | `/loans/[id]` — Approve loan button |
| Repro | Open pending-approval loan before admin fee recorded; Approve disabled |
| Root cause | LoanDetailPanel disabled approve when fee not satisfied; API has no fee gate |
| API / table | POST /loans/:id/approve |
| Recommended fix | Remove fee from approve disable; keep on disburse |
| Regression test | apps/frontend/src/tests/loan-management/loan-approve-fee-gate.test.ts |
| Status | Fixed |

### V181-002 — Guarantor missed-payment SMS repeats daily

| Field | Value |
|-------|-------|
| Severity | P1 |
| Role | System (scheduler) |
| Route | Daily cron, notifyGuarantorMissedPayments |
| Repro | Borrower with more than 2 missed weeks; guarantor SMS every cron run |
| Root cause | No tryAcquireNotificationDelivery dedupe key |
| API / table | notification_delivery_records |
| Recommended fix | Dedupe key guarantor-missed:{borrowerId} |
| Regression test | packages/domain/src/tests/notifications/guarantor-missed-dedupe.test.ts |
| Status | Fixed |

### V181-003 — Collectors can org-search Record Centre API

| Field | Value |
|-------|-------|
| Severity | P1 |
| Role | Collector |
| Route | GET /records/search |
| Repro | Authenticate as collector; call search with query param |
| Root cause | REGISTER_BORROWERS in records read permissions |
| API / table | packages/domain/src/modules/records/routes.ts |
| Recommended fix | Require ACCESS_REGISTRATION_PORTAL |
| Regression test | packages/domain/src/tests/records/records-routes-rbac.test.ts |
| Status | Fixed |

### V181-004 — Group leader guarantor cap not enforced

| Field | Value |
|-------|-------|
| Severity | P1 |
| Role | Registration Officer / Approver |
| Route | Guarantor validation during registration |
| Repro | Leader with 5+ active guarantees still marked eligible |
| Root cause | isExempt branch returned isEligible true without count check |
| API / table | evaluateGuarantorEligibility |
| Recommended fix | Apply activeGuaranteeCount >= maxGuarantees for leaders |
| Regression test | packages/domain/src/tests/borrowers/guarantor-eligibility.test.ts |
| Status | Fixed |

### V181-005 — Settings copy misstates SMS and 2FA scope

| Field | Value |
|-------|-------|
| Severity | P2 |
| Role | Super Admin |
| Route | /settings |
| Repro | Labels imply payment-only SMS and Super-Admin-only 2FA |
| Root cause | Stale UI copy |
| API / table | system_settings |
| Recommended fix | Honest labels |
| Regression test | Doc review |
| Status | Fixed (copy) |

---

## Open — must-fix before production certification

| ID | Severity | Summary |
|----|----------|---------|
| V181-010 | P2 | Migration countGap (45 expected, 44 applied) |
| V181-011 | — | Live T-1 SMS and 06:00 cron not proven |
| V181-012 | — | Full authenticated production workflow smoke |
| V181-013 | P3 | maxGroupSize mapper fallback 10 vs schema 15 |
| V181-014 | P3 | Session timeout setting not wired |
| V181-015 | P3 | gpsVerificationEnabled not gating |
| V181-016 | P3 | Approver lacks loan UI despite APPROVE_LOANS |
| V181-017 | P3 | Dead notification emitters |
| V181-018 | P3 | Pool capital not reserved at loan create |
| V181-019 | — | WCAG 2.2 AA certification |
| V181-020 | — | GhanaPost GPS not in scope |
