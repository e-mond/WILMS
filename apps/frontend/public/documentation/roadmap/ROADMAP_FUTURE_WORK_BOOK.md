# WILMS Future Work — Roadmap Book

**Version:** 1.7.3  
**Classification:** Confidential

---

## 1. Current state

Platform feature development completed at **v1.7.2**. Release **v1.7.3** delivers the official documentation library and removes standalone Export Center in favour of contextual exports.

---

## 2. v1.8 — Integrations and payments

**Target:** Q4 2026

| Item | Description | Priority |
|------|-------------|----------|
| Mobile money integration | MTN MoMo, Vodafone Cash payment recording | High |
| Bank statement import | CSV/OFX import for reconciliation | High |
| Webhook infrastructure | External system event receivers | Medium |
| OpenAPI specification | Auto-generated from domain routes | Medium |
| Payment provider sandbox | Test environment for integrations | Medium |

---

## 3. v1.9 — Enterprise automation

**Target:** Q1 2027

| Item | Description | Priority |
|------|-------------|----------|
| Workflow automation rules | Configurable if/then business rules | High |
| Scheduled report delivery | Email reports on cron schedule | High |
| Advanced notification routing | Role/condition-based routing | Medium |
| Bulk import/export tooling | CSV borrower/loan import | Medium |
| Expense budget limits | Configurable spending caps | Low |

---

## 4. v2.0 — General ledger and multi-branch

**Target:** Q2 2027

| Item | Description | Priority |
|------|-------------|----------|
| Statutory double-entry GL | Full chart of accounts | High |
| Multi-organisation tenancy | Isolated org data | High |
| Branch-level pool isolation | Per-branch capital pools | High |
| Inter-branch transfers | Audited capital movement | Medium |
| SSO / SAML integration | Enterprise identity provider | Medium |

---

## 5. v2.5 — Borrower engagement

**Target:** Q4 2027

| Item | Description | Priority |
|------|-------------|----------|
| Borrower SMS reminders | Payment due notifications | High |
| Payment reminder automation | Schedule-based reminders | Medium |
| Borrower status portal | Read-only borrower self-service | Low |

---

## 6. v3.0 — Platform scale

**Target:** 2028

| Item | Description | Priority |
|------|-------------|----------|
| Multi-region deployment | Geographic redundancy | High |
| ML risk scoring | Predictive default indicators | Medium |
| Localized UI | Twi, Ga, Ewe language support | Medium |
| Partner API marketplace | Third-party integration ecosystem | Low |
| Native mobile app | iOS/Android if PWA insufficient | Low |

---

## 7. Deferred items with rationale

| Item | Deferred to | Rationale |
|------|-------------|-----------|
| Borrower portal | v2.5 | HQ-operated model sufficient |
| Multi-org tenancy | v2.0 | Single-org deployment meets current partners |
| Statutory GL | v2.0 | Pool ledger meets programme needs |
| Native mobile | v3.0 | PWA + field shell adequate |
| Redis job queue | v1.9 | Vercel Cron sufficient at scale |
| Standalone Export Center | Removed v1.7.3 | Contextual exports reduce duplication |
| Full shadcn migration | Ongoing | Incremental per route |
| WCAG full audit | Ongoing | Remediations per QA unit |
| Localized guides | v2.x | English first |

---

## 8. Documentation roadmap

| Item | Version | Status |
|------|---------|--------|
| Official documentation library | v1.7.3 | Complete |
| Static docs web portal | v1.8 | Planned |
| Interactive API explorer | v1.8 | Planned |
| Video walkthroughs | v1.9 | Planned |
| Localized manuals | v2.x | Planned |

---

*CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official record keeping only.*
