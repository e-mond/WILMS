# UX Evolution — Phase 24.9

**Date:** 17 July 2026  
**Extends:** [`UI_UX_ENTERPRISE_REVIEW.md`](../../certification/v1.3.8/enterprise-architecture/UI_UX_ENTERPRISE_REVIEW.md), [`ENTERPRISE_UX_REVIEW.md`](../../certification/v1.3.8/product-acceptance/ENTERPRISE_UX_REVIEW.md)  
**Principle:** Field collector experience is primary; admin density is secondary

---

## UX strategy by version

| Version | UX theme | Primary persona |
|---------|----------|-----------------|
| v1.3.8 | Role-based staff portals; mobile collector flows | Collector |
| v1.4 | Server pagination; recon resubmit polish; ops visibility | Collector + Super Admin |
| v1.5 | GL inquiry (read-only); policy-driven messaging | Approver + Auditor |
| v2.0 | Executive analytics; optional borrower portal | Executive + Borrower |

---

## v1.4 UX scope (in hardening release)

| Item | Why | Benefits | Trade-offs | Effort (pd) | Priority |
|------|-----|----------|------------|-------------|----------|
| Cursor pagination UI | Admin tables truncate at 2000 rows | Correct data; faster loads | Infinite scroll UX work deferred | 8–12 | **P0** |
| Recon resubmit UX | Officers retry failed recon without support ticket | Fewer L2 tickets | Minimal scope only | 3–5 | **P2** |
| Collector performance views | SQL-backed vs list-bound | Accurate rankings | Chart design time | 5–8 | **P2** |
| Money error recovery copy | Immutable payment messaging (v1.3.8) | Clear retry guidance | Copy review | 1–2 | **P1** |
| Offline queue UX | IndexedDB migration | Survives browser clear | Conflict resolution screens | 4–6 | **P1** |

---

## Borrower portal — v1.5+ product decision (NOT v1.4)

| Field | Detail |
|-------|--------|
| **Why deferred** | v1.4 is integrity/scale; borrower self-service is new trust boundary + support model |
| **Benefits (when built)** | Balance lookup, payment history, messaging |
| **Trade-offs** | Auth model (separate login?), PII exposure, support volume |
| **Complexity** | 25–40 pd MVP |
| **Priority** | **Product gate** — not engineering default |

**v1.4 action:** None. Document in PRODUCT_ROADMAP as v1.5 candidate.

**BRD alignment:** WILMS remains staff-operated; borrower portal requires stakeholder BRD amendment.

---

## Mobile

| Approach | v1.4 | v2.0 |
|----------|------|------|
| PWA (current) | Primary — GPS, offline queue | Enhance |
| Responsive admin | Server pagination required | Virtualized tables |
| Native iOS/Android | **Not v1.4** | Product decision if PWA limits hit |

| Field | Detail |
|-------|--------|
| **Why PWA first** | Single codebase; Ghana Android prevalence; installable |
| **Benefits** | Fast iteration; no app store gate |
| **Trade-offs** | iOS PWA limitations; background sync |
| **Complexity** | Native app 60–120 pd |
| **Priority** | **P3** |

---

## Executive analytics

| Capability | v1.3.8 | v1.4 | v1.5+ |
|------------|--------|------|-------|
| Dashboard KPIs | SQL aggregates (collections fixed) | Same + faster lists | CQRS daily snapshots |
| Pool performance | Per-pool cards | SQL views | Cohort charts |
| Forecasting | None | None | Portfolio risk (product) |
| Export | CSV/PDF operational | BullMQ async exports | Signed GL pack |

**v1.4:** No new executive widgets — correctness over charts.

---

## Accessibility (a11y)

| Area | v1.3.8 | v1.4 target |
|------|--------|-------------|
| WCAG 2.1 AA | Claimed in DoD; not re-certified in PA | Re-audit pagination components |
| Keyboard nav | Admin tables weak | Focus management on paginated lists |
| Screen reader | Currency via `<CurrencyAmount />` | Announce page changes |
| Color contrast | Theme tokens | Verify ops dashboard surfaces |

| Field | Detail |
|-------|--------|
| **Why** | Product acceptance noted a11y not re-certified |
| **Benefits** | Inclusive staff tools; audit defense |
| **Trade-offs** | Test time per component |
| **Complexity** | 5–8 pd audit + fixes |
| **Priority** | **P2** |

---

## Role UX map (unchanged philosophy)

```text
Collector     → Mobile-first payment capture, offline queue, GPS
Officer       → Borrower onboarding, group management
Approver      → Loan approval queue, adjustments
Auditor       → Read-only exports, audit log
Super Admin   → Ops /ops, settings, pools, user admin
```

**No separate "Executive login"** — Super Admin + dashboard RBAC covers executives.

---

## UX non-goals

- Borrower portal in v1.4
- Design system rewrite
- Dark mode priority (unless low cost)
- Gamification of collector metrics

---

## UX dependencies on backend

| UX feature | Backend dependency |
|------------|-------------------|
| Paginated tables | Cursor API (PERF-02) |
| Async export progress | BullMQ job status endpoint |
| Offline sync status | Idempotency-Key (FA-04) |
| Ops worker health | `/ops` BullMQ surfaces |

---

## References

- [`FINAL_ENGINEERING_REVIEW.md`](../../certification/v1.3.8/rc-validation/FINAL_ENGINEERING_REVIEW.md) — UX friction summary
- [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md)
