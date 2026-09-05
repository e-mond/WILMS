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

---

## Sprint 5 Sep 2026 — mobile nav / ops / requests (this sprint)

### V181-021 — Mobile bottom pill nav clipped; Help FAB overlaps

| Field | Value |
|-------|-------|
| Severity | P0 |
| Role | Collector, Approver, Officer, Auditor (+ SA header crowding) |
| Route | All role shells |
| Repro | Viewport ≤430px; icons squeeze; Help overlays nav |
| Root cause | OperationalBottomNavigation rendered every nav item; Help FAB fixed bottom-right z-90 |
| Fix | Enable mobile drawer for all office/field shells; remove bottom pill when drawer on; Help via FloatingActionStack; drop duplicate Settings icon from mobile bar |
| Regression test | shells.test.tsx, mobile-sidebar-expanded.test.tsx |
| Status | Fixed |

### V181-022 — Operations page showed Reassignment + Deployment engineering info

| Field | Value |
|-------|-------|
| Severity | P1 |
| Role | Super Admin |
| Route | `/ops` |
| Fix | Removed Reassignment controls and Deployment sections from OperationsDashboardPanel; reassignment remains at `/ops/reassignment` |
| Status | Fixed |

### V181-023 — System Status aside linked to GitHub README

| Field | Value |
|-------|-------|
| Severity | P1 |
| Role | Super Admin |
| Route | Settings aside |
| Fix | Removed Documentation / Project README from SettingsAsidePanel |
| Status | Fixed |

### V181-024 — Holiday request queue lived only under Settings

| Field | Value |
|-------|-------|
| Severity | P1 |
| Role | Super Admin |
| Route | `/settings?section=holidays`, `/borrower-updates` |
| Fix | Central Requests centre at `/borrower-updates` (tabs: borrower updates + holidays); Settings Holidays keeps calendar only; nav label → Requests |
| Status | Fixed |

### V181-025 — Organisation settings editable but not applied to UI/exports

| Field | Value |
|-------|-------|
| Severity | P1 |
| Role | Super Admin |
| Route | Settings → Organisation |
| Root cause | Values saved to DB; UI/theme/exports use design tokens + WILMS_ORG_* constants |
| Fix | Made Organisation branding fields read-only with honest copy |
| Status | Fixed |

### V181-026 — Collector profile photo not passport-style

| Field | Value |
|-------|-------|
| Severity | P2 |
| Role | Super Admin |
| Route | `/collectors/[id]` |
| Fix | Passport-aspect portrait using live photoUrl with initials fallback |
| Status | Fixed |

