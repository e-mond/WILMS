# Enterprise Evolution Plan — Phase 24.5

**Date:** 17 July 2026  
**Audience:** Board, banking partners, NGO sponsors  
**Posture:** Honest gap analysis — WILMS is a **women's interest-free microfinance operations platform**, not a replacement for SAP S/4HANA on day one.

---

## WILMS positioning

| Dimension | WILMS sweet spot | Enterprise ERP sweet spot |
|-----------|------------------|---------------------------|
| Primary user | Field collectors, loan officers, pool admins | Finance shared services, GL accountants |
| Loan model | Weekly full payment, no partials, no interest (BRD) | Generic lending products, interest accrual |
| Geography | Ghana field ops, GPS capture, mobile-first | Global statutory, multi-currency |
| Deployment | Single-org, sponsor-operated | Multi-entity, multi-ledger |
| Time-to-value | Weeks | 12–36 months |

**Strategic choice:** Win on **operational integrity in women's microfinance**, then add **statutory GL credibility** (v1.5–v2.0). Do not compete on ERP breadth.

---

## Comparator summary

| Vendor | Category | Overlap with WILMS | WILMS advantage | WILMS gap |
|--------|----------|-------------------|-----------------|-----------|
| **Microsoft Dynamics 365** | ERP + optional lending | Financial reporting, workflows | Purpose-built microfinance UX; BRD rules enforced | Statutory GL, multi-entity, ecosystem |
| **SAP S/4HANA** | Enterprise ERP | Treasury, accounting | Simplicity; field GPS collection; NGO pricing | Everything at scale |
| **Oracle Fusion** | Enterprise ERP + HCM | Financials | Same as SAP | Same as SAP |
| **Temenos Transact** | Core banking | Loan servicing | Lighter deploy; women's program fit | Core banking rails, SWIFT, cards |
| **Mambu** | Cloud lending engine | Loan lifecycle API | Integrated ops UI + recon + pools | API-first composability, global compliance certs |
| **Finflux** | Microfinance MIS | Field collection, groups | Modern stack; active v1.3.8 remediation | Finflux maturity in MFI vertical |
| **Apache Fineract** | Open-source core | Loan + savings | Product UX; hosted SaaS path; support model | Community extensibility, reference model |

---

## Missing capabilities matrix

| Capability | Dynamics | SAP | Oracle | Temenos | Mambu | Finflux | Fineract | WILMS v1.3.8 | WILMS v1.4 | WILMS v2.0 target |
|------------|----------|-----|--------|---------|-------|---------|----------|--------------|------------|-------------------|
| Double-entry GL / TB | ✅ | ✅ | ✅ | ✅ | ⚙️ partner | ⚙️ | ⚙️ | ❌ | 🔶 prep | ✅ |
| Period close / lock | ✅ | ✅ | ✅ | ✅ | ⚙️ | ⚙️ | ⚙️ | ❌ | ❌ | ✅ |
| Multi-branch / entity | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | 🔶 |
| Field mobile collection | ⚙️ | ⚙️ | ⚙️ | ⚙️ | ⚙️ | ✅ | ⚙️ | ✅ | ✅+ | ✅ |
| GPS-verified payments | ❌ | ❌ | ❌ | ❌ | ❌ | ⚙️ | ❌ | ✅ | ✅ | ✅ |
| Interest-free weekly rules | ❌ | ❌ | ❌ | ❌ | ⚙️ config | ✅ | ⚙️ | ✅ | ✅ | ✅ |
| Pool / donor capital tracking | ⚙️ | ✅ | ✅ | ✅ | ⚙️ | ✅ | ⚙️ | ✅ | ✅ | ✅ |
| Collector cash recon | ⚙️ | ✅ | ✅ | ✅ | ⚙️ | ✅ | ⚙️ | ✅ | ✅ | ✅ |
| Durable job queue | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚙️ | ❌ | ✅ | ✅ |
| Idempotent money API | ✅ | ✅ | ✅ | ✅ | ✅ | ⚙️ | ⚙️ | ⚙️ optional | ✅ | ✅ |
| Tamper-evident audit | ✅ | ✅ | ✅ | ✅ | ⚙️ | ⚙️ | ⚙️ | ⚙️ | 🔶 MVP | ✅ |
| ABAC / policy engine | ✅ | ✅ | ✅ | ✅ | ✅ | ⚙️ | ⚙️ | ❌ RBAC only | ❌ | ✅ |
| Borrower self-service | ⚙️ | ⚙️ | ⚙️ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | 🔶 v1.5+ |
| Regulatory report packs | ✅ | ✅ | ✅ | ✅ | ⚙️ | ✅ | ⚙️ | ❌ | ❌ | 🔶 |
| Horizontal scale / HA | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚙️ | ⚙️ | 🔶 | ✅ |
| AI / analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ | 🔶 assist |

Legend: ✅ production-grade | 🔶 planned/partial | ⚙️ configurable/partner | ❌ absent

---

## Gap prioritization (WILMS roadmap)

### Close in v1.4 (operational credibility)

| Gap | Why partners care | Effort (pd) | Priority |
|-----|-------------------|-------------|----------|
| Durable queues | "Will SMS receipts survive deploy?" | 12–18 | **P0** |
| Idempotency | "Can collectors double-charge?" | 4–6 | **P0** |
| List/pagination correctness | "Are reports complete?" | 10–15 | **P0** |
| Observability | "Can SRE see payment failures?" | 8–12 | **P0** |
| Restore drills | "Can you recover from DB loss?" | 5–8 | **P0** |

### Close in v1.5 (financial credibility)

| Gap | Why partners care | Effort (pd) | Priority |
|-----|-------------------|-------------|----------|
| Double-entry GL dual-write | "Show me a trial balance" | 25–40 | **P0** |
| Period close | "Can books be locked?" | 8–12 | **P0** |
| Balance drift monitor | "Does portfolio match GL?" | 5–8 | **P0** |
| Signed audit exports | "Prove this wasn't edited" | 8–12 | **P1** |
| ABAC / policy | "Segregation of duties by branch" | 20–30 | **P1** |

### Close in v2.0 (enterprise parity — niche)

| Gap | Effort (pd) | Priority |
|-----|-------------|----------|
| GL authoritative cutover | 15–30 | **P0** |
| Multi-branch org model | 30–50 | **P1** |
| Compliance report packs | 15–25 | **P1** |
| 1M+ row archival playbook | 10–20 | **P1** |

### Explicitly not pursuing (vs SAP/Dynamics)

- Full HCM / payroll
- Supply chain / inventory
- Multi-currency treasury trading
- Card issuing / core banking rails
- Global tax engine

---

## Partner conversation script

**When a bank asks "Why not Temenos?"**

> WILMS is purpose-built for women's interest-free group lending with GPS-verified field collection and pool capital tracking. Temenos is the right choice for a licensed bank's core ledger. WILMS is the right choice for the NGO/MFI operating model until you're ready to feed statutory journals into your core — which is our v1.5 GL track.

**When an acquirer asks "Is this SAP-grade?"**

> Not today. v1.3.8 is acquisition-ready as an **operational field product** with a documented path to GL credibility (60–105 pd + accountant partnership). SAP-grade statutory close is a v2.0 milestone, not a day-one claim.

---

## Recommendation

| Stakeholder | Message |
|-------------|---------|
| Board | Invest in v1.4 hardening, not ERP breadth |
| Banking partner | Review v1.5 GL dual-write staging before relying on books |
| NGO sponsor | v1.3.8 is deployable for field ops; accept documented limitations |
| Engineering | Modular monolith + GL sidecar, not microservices |

---

## References

- [`ENTERPRISE_ROADMAP_v14_v15_v20.md`](../../certification/v1.3.8/enterprise-architecture/ENTERPRISE_ROADMAP_v14_v15_v20.md)
- [`FINAL_ENGINEERING_REVIEW.md`](../../certification/v1.3.8/rc-validation/FINAL_ENGINEERING_REVIEW.md)
- [`FINANCIAL_ENGINE_V2_DESIGN.md`](./FINANCIAL_ENGINE_V2_DESIGN.md)
