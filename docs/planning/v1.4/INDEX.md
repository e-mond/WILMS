# WILMS Phase 24 — v1.4 Planning Hub

**Date:** 17 July 2026  
**Phase:** 24 (Planning & Design)  
**Status:** Planning only — **no application code changes in this phase**  
**Software baseline:** v1.3.8 complete; operator production certification evidence pending

---

## Purpose

Phase 24 converts v1.3.8 enterprise architecture findings into an actionable v1.4 plan. This folder is the **single planning SSoT** for engineering, product, and operations leadership through the next major release cycle.

---

## Deliverables (this folder)

| Document | Phase | Audience | Summary |
|----------|-------|----------|---------|
| [V13_MAINTENANCE_STRATEGY.md](./V13_MAINTENANCE_STRATEGY.md) | 24.1 | Engineering, Ops | v1.3.x freeze, semver, hotfix workflow — **branch not created until production certified** |
| [WILMS_V14_ROADMAP.md](./WILMS_V14_ROADMAP.md) | 24.2–24.3 | Engineering, Product | v1.4 objectives, features, platform evolution table, effort & dependencies |
| [LONG_TERM_ARCHITECTURE.md](./LONG_TERM_ARCHITECTURE.md) | 24.3 | Architecture | Modular monolith, bounded contexts, v1.4→v2.0 target state, mermaid diagrams |
| [SCALABILITY_REVIEW.md](./SCALABILITY_REVIEW.md) | 24.4 | Engineering, SRE | 10→100k user tiers, codebase-derived bottlenecks |
| [ENTERPRISE_EVOLUTION_PLAN.md](./ENTERPRISE_EVOLUTION_PLAN.md) | 24.5 | Leadership, Partners | WILMS vs Dynamics/SAP/Oracle/Temenos/Mambu/Finflux/Fineract |
| [FINANCIAL_ENGINE_V2_DESIGN.md](./FINANCIAL_ENGINE_V2_DESIGN.md) | 24.6 | Finance, Engineering | GL/TB/CoA/periods design — v1.5 implementation prep |
| [DEVELOPER_EXPERIENCE_REVIEW.md](./DEVELOPER_EXPERIENCE_REVIEW.md) | 24.7 | Engineering | Monorepo, CI, testing, OpenAPI, knip/madge |
| [OPERATIONS_ROADMAP.md](./OPERATIONS_ROADMAP.md) | 24.8 | SRE, Ops | OTel, Prometheus/Grafana, DR, SLA, support tiers |
| [UX_EVOLUTION.md](./UX_EVOLUTION.md) | 24.9 | Product, Design | Borrower portal (v1.5+), mobile, analytics, a11y |
| [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) | 24.9 | Product | Themes by version and persona |
| [EXECUTIVE_STRATEGY.md](./EXECUTIVE_STRATEGY.md) | 24.10 | Board, Sponsors | Niche positioning — women's interest-free microfinance ops |
| [MASTER_ROADMAP.md](./MASTER_ROADMAP.md) | 24.10 | All | Prioritized timeline: 3mo / 6mo / 1yr / 2yr |

---

## Upstream v1.3.8 references (extend, do not duplicate)

| Source | Path | Relationship |
|--------|------|--------------|
| Enterprise roadmap v1.4/v1.5/v2.0 | [`docs/certification/v1.3.8/enterprise-architecture/ENTERPRISE_ROADMAP_v14_v15_v20.md`](../../certification/v1.3.8/enterprise-architecture/ENTERPRISE_ROADMAP_v14_v15_v20.md) | Version themes, milestones M1–M3 |
| Double-entry GL migration | [`docs/certification/v1.3.8/enterprise-architecture/DOUBLE_ENTRY_LEDGER_MIGRATION_ROADMAP.md`](../../certification/v1.3.8/enterprise-architecture/DOUBLE_ENTRY_LEDGER_MIGRATION_ROADMAP.md) | Phase A/B/C GL phases |
| Excellence roadmap | [`docs/certification/v1.3.8/enterprise-excellence/ROADMAP_v1.4_v2.0.md`](../../certification/v1.3.8/enterprise-excellence/ROADMAP_v1.4_v2.0.md) | Hardening backlog |
| Maintenance branch plan | [`docs/certification/v1.3.8/production-cutover/MAINTENANCE_BRANCH_PLAN.md`](../../certification/v1.3.8/production-cutover/MAINTENANCE_BRANCH_PLAN.md) | Post-certification git procedure |
| Architecture recommendations | [`docs/certification/v1.3.8/enterprise-architecture/ENTERPRISE_ARCHITECTURE_RECOMMENDATIONS.md`](../../certification/v1.3.8/enterprise-architecture/ENTERPRISE_ARCHITECTURE_RECOMMENDATIONS.md) | FA/DA/PERF/SEC item IDs |
| Production acceptance | [`docs/certification/v1.3.8/production-cutover/PRODUCTION_ACCEPTANCE_CHECKLIST.md`](../../certification/v1.3.8/production-cutover/PRODUCTION_ACCEPTANCE_CHECKLIST.md) | Operator evidence gates |
| Engineering review | [`docs/certification/v1.3.8/rc-validation/FINAL_ENGINEERING_REVIEW.md`](../../certification/v1.3.8/rc-validation/FINAL_ENGINEERING_REVIEW.md) | H1–H6 weakness ranking |

---

## Explicit non-goals (Phase 24 and v1.4)

- Microservices mesh or distributed monolith rewrite
- Frontend framework replacement (Next.js 14 stays)
- Cryptocurrency or exotic ledger experiments
- Inventing v1.3.x application changes under the guise of planning
- Borrower self-service portal as v1.4 core (deferred to v1.5+ product decision)

---

## Guiding principles (carried forward)

1. **Money integrity before features.**
2. **Modular monolith** until a bounded context must scale independently.
3. **Operational ledger + GL dual-write** — no big-bang field ops rewrite.
4. **SQL-derived KPIs** before cache-heavy shortcuts.
5. **Every financial change ships with audit evidence.**

---

## Phase 24 exit criteria

| # | Criterion | Owner |
|---|-----------|-------|
| 1 | All 13 planning documents reviewed by engineering lead | CTO |
| 2 | v1.4 P0 backlog agreed and sized (person-days) | Engineering |
| 3 | Maintenance strategy acknowledged — branch creation gated on certification | Ops |
| 4 | GL design reviewed with finance stakeholder (design only) | Product + Finance |
| 5 | No code merged from Phase 24 planning work | Engineering |
