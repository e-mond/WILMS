# Product Roadmap — Themes by Version & Persona

**Date:** 17 July 2026  
**Phase:** 24.9 / 24.10  
**Extends:** [`ROADMAP_v1.4_v2.0.md`](../../certification/v1.3.8/enterprise-excellence/ROADMAP_v1.4_v2.0.md)

---

## Product vision

WILMS is the **operating system for women's interest-free microfinance**: enforce BRD money rules in the field, track pool capital, reconcile collector cash, and give leadership honest KPIs — then graduate to partner-grade books.

---

## Version themes

| Version | Theme | Tagline |
|---------|-------|---------|
| **v1.3.8** | Production-ready field ops | "Collect with confidence" |
| **v1.4** | Enterprise hardening | "Trust the numbers at scale" |
| **v1.5** | Enterprise accounting & policy | "Books the bank can read" |
| **v2.0** | Platform maturity | "Multi-site, audit-ready, GL authoritative" |

---

## Persona × version matrix

| Persona | v1.3.8 | v1.4 | v1.5 | v2.0 |
|---------|--------|------|------|------|
| **Collector** | GPS payment, offline queue, same-day edit rules | IndexedDB queue, idempotent sync, paginated history | Policy-driven fee messages | Stronger offline-first |
| **Registration Officer** | Borrower/group onboarding, blacklist | Fast borrower search (cursor lists) | Field encryption if required | Multi-branch registration |
| **Loan Officer** | Pipeline, disburse with admin fee gate | Async exports | Workflow approvals | Branch-scoped portfolio |
| **Approver** | Loan/adjustment approval | Same | Maker-checker tables, access certification export | SoD by branch |
| **Auditor** | Immutable audit log, read-only RBAC | Hash-chain MVP, restore evidence | Signed GL export pack, TB | Full statutory pack |
| **Super Admin** | Pools, settings, `/ops` dashboard | BullMQ admin, OTel-linked ops, feature flags | GL inquiry read-only, period close | Multi-branch admin |
| **Executive / Sponsor** | Dashboard KPIs (SQL) | Correct totals at 100k payments | Month-end TB, drift = 0 | Portfolio analytics, forecasting |
| **Borrower** | ❌ No portal | ❌ **Not v1.4** | 🔶 Portal candidate (product gate) | Self-service balance/history |

---

## Feature themes by version

### v1.3.8 (complete — operator evidence pending)

- Weekly full-payment enforcement
- Pool capital tracking
- Collector cash reconciliation
- RBAC + override TTL
- Super Admin Operations dashboard
- SQL dashboard collections (Phase 18)

### v1.4 — Hardening (engineering-led product)

| Theme | Features |
|-------|----------|
| **Integrity** | Mandatory idempotency; outbox events |
| **Scale** | Cursor pagination; durable workers |
| **Visibility** | OTel, Prometheus, alert matrix |
| **Resilience** | IndexedDB offline; restore drills |
| **Velocity** | OpenAPI, knip/madge, Node 22 |

**Product-visible:** Faster lists, reliable SMS/email, ops worker status. **Not product-visible:** GL schema prep.

### v1.5 — Accounting & policy

| Theme | Features |
|-------|----------|
| **Books** | GL dual-write, trial balance, period close |
| **Controls** | ABAC, versioned policies, drift monitor |
| **Audit** | Signed export pack, hash-chain production |
| **Product option** | Borrower portal BRD amendment |
| **Communications** | Worker isolation complete |

### v2.0 — Platform maturity

| Theme | Features |
|-------|----------|
| **Authority** | GL cutover for cash & P&L |
| **Organization** | Multi-branch / multi-pool hierarchy |
| **Analytics** | Cohort risk, forecasting (product) |
| **Compliance** | NGO/bank/gov report packs |
| **Scale** | 1M+ row archival, optional service extract |

---

## Product decisions required (gates)

| Decision | Owner | Blocks | Default if no decision |
|----------|-------|--------|------------------------|
| Borrower portal v1.5? | Sponsor + Product | v1.5 scope | Defer to v2.0 |
| Pool as liability vs equity | Accountant | GL CoA | Document both; flag at deploy |
| Field PII encryption | Legal/partner | v1.5 security | RBAC-only |
| Multi-branch priority | Sponsor | v2.0 schema | Single-org through v1.5 |

---

## Competitive product positioning

| Competitor strength | WILMS response |
|--------------------|----------------|
| Finflux MFI vertical | Match on field ops; exceed on modern UX + remediation velocity |
| Mambu API composability | Integrate via exports/events v1.5+; not API-first day one |
| SAP/Dynamics GL | Do not compete — feed partner core via GL export v1.5 |

---

## Success metrics

| Version | Product KPI |
|---------|-------------|
| v1.4 | Zero duplicate payment incidents; list completeness verified; SMS delivery >99% post-deploy |
| v1.5 | TB balances 30 days; partner reviews GL export without blocker |
| v2.0 | Independent audit pass; multi-site pilot live |

---

## References

- [`EXECUTIVE_STRATEGY.md`](./EXECUTIVE_STRATEGY.md)
- [`WILMS_V14_ROADMAP.md`](./WILMS_V14_ROADMAP.md)
- [`UX_EVOLUTION.md`](./UX_EVOLUTION.md)
