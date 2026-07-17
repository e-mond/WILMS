# WILMS Phase 17 — Enterprise Architecture Recommendations

**Audience:** Engineering leadership, auditors, banking partners, product  
**Date:** 17 July 2026  
**Branch context:** `cursor/v138-enterprise-financial-8847` (post Critical/High financial remediation)  
**Posture:** Independent architecture review — recommendations are justified against the current codebase, not aspirational pattern fashion.

---

## Executive summary

WILMS today is a **modular Express + Next.js monorepo** with a solid **operational microfinance ledger** (append-only event rows, compensating reversals, pool allocations, RBAC, HMAC sessions). It is **not** yet a statutory **double-entry general ledger**, does **not** use durable job infrastructure, and will **hit hard ceilings** well below 100k–1M row scale on dashboard/report paths.

| Domain | Current fitness | Primary next leap |
|---|---|---|
| Financial ops (field collection) | Strong after v1.3.8 remediation | Keep operational ledger; add derived-balance verification |
| Statutory / partner GL | Insufficient | Dual-write → double-entry CoA (v1.5→v2.0) |
| Domain modularity | Modular monolith (good) | Explicit bounded contexts; avoid microservices until scale forces it |
| Security | RBAC + overrides + scoping | Policy engine + signed audit (enterprise rollout) |
| Scale | Small/medium org | SQL aggregates, cursor pagination, Redis/BullMQ |
| Reliability | Neon PITR docs; in-process jobs | Durable queues, restore drills, HA runbooks |
| DevOps | CI + manual prod deploy | Canary, tracing, unified Node version |
| Docs | High volume, fragmented | Single architecture SSoT + doc index |

**Do not migrate to microservices or full event sourcing as a first step.** Prefer a **modular monolith**, **SQL-derived KPIs**, **durable workers**, then a **chart-of-accounts GL** alongside (not replacing) the operational loan ledger.

Companion docs:

- [DOUBLE_ENTRY_LEDGER_MIGRATION_ROADMAP.md](./DOUBLE_ENTRY_LEDGER_MIGRATION_ROADMAP.md)
- [ENTERPRISE_ROADMAP_v14_v15_v20.md](./ENTERPRISE_ROADMAP_v14_v15_v20.md)
- [DOCUMENTATION_AUDIT.md](./DOCUMENTATION_AUDIT.md)
- [CODE_QUALITY_REVIEW.md](./CODE_QUALITY_REVIEW.md)
- [UI_UX_ENTERPRISE_REVIEW.md](./UI_UX_ENTERPRISE_REVIEW.md)
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)

---

## Severity rubric (this document)

| Class | Meaning |
|---|---|
| **Critical** | Must address before trusting production money/ops at current scale *or* before claiming closed-ledger audit readiness where gaps remain |
| **High** | Required before banking-partner / regulator / multi-branch enterprise rollout |
| **Medium** | Target for next major release (v1.4–v1.5) |
| **Low** | Future enhancement (v2.0+) |

Effort is sized as **engineering complexity** (person-days of focused senior work), not calendar schedules.

---

# 1. Financial Architecture

## FA-01 — Migrate toward immutable journal + derived balances (keep operational model first)

| Field | Detail |
|---|---|
| **Class** | **High** (enterprise rollout); Medium if only operating current single-org production with remediation branch deployed |
| **Current** | `ledger_entries` append-only event journal; `loans.loan_balance` and `loan_pools.*` aggregates are **mutable** denormalized fields updated in the same transaction |
| **Why insufficient** | Auditors expect balances = f(transactions). Mutable caches can diverge if any writer skips a side effect |
| **Risks** | Silent KPI/loan balance drift; failed external audit of “closed books” |
| **Solution** | (1) Nightly/continuous **balance reconciliation job** comparing `loan_balance` vs Σ ledger; (2) treat ledger as SoT; (3) eventually stop mutating balance except as projection |
| **Migration** | Add verification queries → alert on drift → dual-read period → make balance a materialized view or projection table |
| **Effort** | 8–15 person-days (verify + alerts); 25–40 for full derived-only balances |
| **Performance** | Verification is O(loans) batch; derived reads need indexes on `ledger_entries(loan_id)` |
| **Security** | Improves integrity evidence for auditors |
| **Maintainability** | Fewer “forgot to update balance” bugs |

## FA-02 — Double-entry General Ledger (CoA)

| Field | Detail |
|---|---|
| **Class** | **High** for banking partners / statutory reporting; **not Critical** for field-ops microfinance if FA-01 + current remediation hold |
| **Current** | Single-sided event types (`LOAN_DISBURSEMENT`, `REPAYMENT`, …); no debit/credit, no chart of accounts |
| **Why insufficient** | Cannot produce trial balance, period close, or partner GL exports that balance |
| **Risks** | Partner rejection; regulatory “books of record” finding |
| **Solution** | Separate `gl_accounts` + `gl_journal_entries` (header) + `gl_journal_lines` (debit/credit). Map each operational event → balanced journal via posting rules |
| **Migration** | See [DOUBLE_ENTRY_LEDGER_MIGRATION_ROADMAP.md](./DOUBLE_ENTRY_LEDGER_MIGRATION_ROADMAP.md) |
| **Effort** | 60–120 person-days across design + dual-write + reports + cutover |
| **Performance** | Extra writes per money event; report queries on indexed lines are fine |
| **Security** | Clearer segregation of posting vs operational roles |
| **Maintainability** | Higher initial complexity; long-term clearer accounting boundary |

## FA-03 — End-of-day balancing, trial balance, financial audit exports

| Field | Detail |
|---|---|
| **Class** | **High** (depends on FA-02) |
| **Current** | Collector cash reconciliation snapshots; executive dashboard formulas; CSV/Excel/PDF operational reports |
| **Why insufficient** | No period lock, no trial balance, no GL export pack |
| **Risks** | Manual spreadsheet close; undetected imbalance |
| **Solution** | EOD job: lock period → generate trial balance → export pack (CSV + hash manifest) |
| **Migration** | After GL dual-write stable |
| **Effort** | 20–35 person-days |
| **Performance** | Batch off peak |
| **Security** | Signed export manifests (see SEC-04) |
| **Maintainability** | Standard close procedures |

## FA-04 — Mandatory Idempotency-Key on all money POSTs

| Field | Detail |
|---|---|
| **Class** | **Critical** before high-volume field use / multi-device collectors |
| **Current** | Idempotency optional; scopes exist for payment/disburse/reversal/recon/adjustment |
| **Why insufficient** | Mobile retries can double-post without header |
| **Risks** | Duplicate collections/disbursements |
| **Solution** | Require `Idempotency-Key` (422 if missing) on money POSTs; reject weak keys |
| **Migration** | Update frontend/offline queue first → enforce API |
| **Effort** | 3–5 person-days |
| **Performance** | Negligible |
| **Security** | Fraud/ops integrity |
| **Maintainability** | Clear contract |

## FA-05 — Financial event sourcing (selective)

| Field | Detail |
|---|---|
| **Class** | **Medium** (loan lifecycle + payments only); **Low** for full-system event sourcing |
| **Current** | Partial event log via ledger + history tables; not a full event store |
| **Why insufficient / when justified** | Full ES everywhere adds ops cost. Justified for **loan aggregate** and **payment** to rebuild state for disputes |
| **Risks of full ES** | Complexity, replay bugs, team skill gap |
| **Solution** | Keep modular services; add snapshot + event stream for loan aggregate only if dispute volume warrants |
| **Migration** | Optional after FA-01 |
| **Effort** | 30–50 person-days if pursued |
| **Performance** | Rebuild cost; snapshots required |
| **Security** | Excellent forensic trail if done well |
| **Maintainability** | High cost — justify with dispute volume |

---

# 2. Domain Architecture

## DA-01 — Explicit bounded contexts inside the modular monolith

| Field | Detail |
|---|---|
| **Class** | **Medium** |
| **Current** | `modules/*` folders (loans, payments, pools, expenses, communications, settings…) sharing one DB |
| **Why insufficient** | Cross-module imports and mega-services (`settings/service.ts` ~1.4k LOC) blur boundaries |
| **Risks** | Change coupling; harder onboarding |
| **Solution** | Document contexts: **Identity**, **Onboarding**, **Lending**, **Collections**, **Treasury/Pools**, **Operating Cash**, **Reconciliation**, **Communications**, **Admin**. Public APIs per context; no deep cross-imports |
| **Migration** | Package boundaries (`packages/domain-*`) gradually; no rewrite |
| **Effort** | 15–25 person-days documentation + extraction |
| **Performance** | Neutral |
| **Security** | Clearer permission ownership per context |
| **Maintainability** | High positive |

## DA-02 — Modular monolith vs microservices

| Field | Detail |
|---|---|
| **Class** | **High** (decision): **stay modular monolith through v1.5** |
| **Current** | Single API process + Next BFF |
| **Why microservices insufficient justification now** | Team size, shared Neon DB, low QPS; split would add distributed failure modes without scale need |
| **Risks if split early** | Dual deploys, distributed transactions, ops burden |
| **Solution** | Modular monolith until a context has independent scale/SLA (likely Communications or Reporting) |
| **Migration** | Extract workers first (queue), not network services |
| **Effort** | Decision + ADR: 1–2 person-days |
| **Performance / Security / Maintainability** | Monolith wins until ~multi-region or independent scale |

## DA-03 — CQRS for reporting / dashboards

| Field | Detail |
|---|---|
| **Class** | **High** before 100k+ rows |
| **Current** | Command path and read path share `listPayments`/`listBorrowers` into Node reduces |
| **Why insufficient** | Silent 2000-row caps; CPU in API |
| **Risks** | Wrong KPIs; timeouts |
| **Solution** | Read models: SQL views / materialized daily snapshots for dashboard; commands stay transactional |
| **Migration** | Replace `buildDashboardFinancialOverview` JS reduces with SQL |
| **Effort** | 10–20 person-days |
| **Performance** | Large win |
| **Security** | Same RBAC on read APIs |
| **Maintainability** | Clear command/query split |

## DA-04 — Workflow engine for approvals

| Field | Detail |
|---|---|
| **Class** | **Medium** |
| **Current** | Hand-coded lifecycle (`LOAN_LIFECYCLE`) + adjustment approval |
| **Why insufficient** | Multi-step org policies (maker-checker-checker) hardcode poorly |
| **Risks** | Policy drift across products |
| **Solution** | Lightweight workflow table (state, assignee, SLA) before adopting Camunda/Temporal; Temporal only if multi-day human workflows explode |
| **Migration** | Start with loan + adjustment + recon review |
| **Effort** | 20–40 person-days (in-house); more for Temporal |
| **Performance** | Neutral |
| **Security** | Better SoD evidence |
| **Maintainability** | Medium |

## DA-05 — Configurable rule engine (fees, holidays, thresholds)

| Field | Detail |
|---|---|
| **Class** | **Medium** |
| **Current** | Settings + code (`variance` threshold, holidays, admin fee) |
| **Why insufficient** | Policy changes require deploys |
| **Risks** | Shadow spreadsheets |
| **Solution** | Versioned policy documents (JSON schema) with effective dates; evaluate in domain services |
| **Migration** | Extract thresholds first |
| **Effort** | 15–25 person-days |
| **Performance** | Cache policies in memory |
| **Security** | Audit policy changes |
| **Maintainability** | Positive if scoped; avoid generic “Drools for everything” |

## DA-06 — Event-driven architecture (internal)

| Field | Detail |
|---|---|
| **Class** | **Medium** |
| **Current** | Direct `void notifyX()` calls from services; in-process |
| **Why insufficient** | Coupling; lost on crash |
| **Risks** | Missed notifications; hard to add consumers |
| **Solution** | Outbox table + worker (after Redis/BullMQ); domain events `LoanDisbursed`, `PaymentRecorded` |
| **Migration** | Outbox dual-write in money services → worker |
| **Effort** | 15–30 person-days |
| **Performance** | Async off critical path |
| **Security** | Auditable event log |
| **Maintainability** | Better decoupling |

---

# 3. Security Architecture

## SEC-01 — Policy engine / ABAC expansion

| Field | Detail |
|---|---|
| **Class** | **High** for multi-branch enterprise |
| **Current** | RBAC + permission overrides + resource scoping (collector↔group) |
| **Why insufficient** | Branch/region/time/amount policies not centralized |
| **Risks** | Ad-hoc ifs; SoD holes as org grows |
| **Solution** | Central policy module: `can(actor, action, resource, context)`; keep RBAC as input attributes |
| **Migration** | Wrap existing access helpers |
| **Effort** | 20–35 person-days |
| **Performance** | Cache decisions per request |
| **Security** | High positive |
| **Maintainability** | One place for authz |

## SEC-02 — Fine-grained permission overrides (already present — harden)

| Field | Detail |
|---|---|
| **Class** | **Medium** |
| **Current** | `user_permission_overrides` with audit |
| **Why insufficient** | Need expiry, approver dual-control, periodic access review |
| **Risks** | Standing elevated access |
| **Solution** | TTL on overrides; quarterly access certification report |
| **Effort** | 5–10 person-days |
| **Security** | High |
| **Maintainability** | Medium |

## SEC-03 — Tamper-evident / signed audit trails

| Field | Detail |
|---|---|
| **Class** | **High** for regulator inspections |
| **Current** | Append-oriented `audit_entries` without hash chain |
| **Why insufficient** | DB admin could alter history undetected |
| **Risks** | Audit evidence challenge |
| **Solution** | Hash chain (`prev_hash`, `entry_hash`) + periodic external anchor (S3 Object Lock / WORM) |
| **Migration** | New columns; backfill null for legacy |
| **Effort** | 10–18 person-days |
| **Performance** | Negligible write cost |
| **Security** | High |
| **Maintainability** | Medium |

## SEC-04 — Secrets management & key rotation

| Field | Detail |
|---|---|
| **Class** | **High** |
| **Current** | Env vars on Railway/Vercel; session HMAC secret |
| **Why insufficient** | No rotation playbook; shared secrets in multiple platforms |
| **Risks** | Long-lived compromise |
| **Solution** | Railway/Vercel secret rotation runbook; dual-secret session verify during rotation window; prefer cloud secret manager if multi-env grows |
| **Effort** | 5–12 person-days |
| **Security** | High |
| **Maintainability** | Ops discipline |

## SEC-05 — Field-level encryption for PII

| Field | Detail |
|---|---|
| **Class** | **Medium** (High if regulator demands) |
| **Current** | TLS in transit; DB encryption at rest (Neon); app-level plaintext PII columns |
| **Why insufficient** | Insider DB read exposes phones/IDs |
| **Risks** | Breach blast radius |
| **Solution** | Envelope encryption for national ID / phone; searchable tokens where needed |
| **Effort** | 25–40 person-days |
| **Performance** | Encrypt/decrypt overhead; limit to sensitive columns |
| **Security** | High |
| **Maintainability** | Key custody complexity |

## SEC-06 — Hardware-backed encryption / HSM

| Field | Detail |
|---|---|
| **Class** | **Low** until regulated banking custody required |
| **Current** | Software secrets |
| **Solution** | Cloud KMS/HSM when partner contract requires |
| **Effort** | 20–40 person-days + vendor |
| **Security** | Highest |
| **Maintainability** | Vendor lock-in tradeoff |

---

# 4. Performance & Scalability

## PERF-01 — Replace load-all KPI paths with SQL aggregates

| Field | Detail |
|---|---|
| **Class** | **Critical** before ~10k–50k payments |
| **Current** | Dashboard/`listPayments` default cap 2000; JS reduce |
| **Why insufficient** | Silent truncation → wrong money KPIs |
| **Risks** | Leadership decisions on false totals |
| **Solution** | `SUM`/`COUNT` SQL; materialized daily KPI table |
| **Effort** | 8–15 person-days |
| **Performance** | Orders of magnitude |
| **Security** | Integrity |
| **Maintainability** | Less Node aggregation |

## PERF-02 — Cursor pagination + server-driven lists

| Field | Detail |
|---|---|
| **Class** | **High** |
| **Current** | Offset caps; frontend `usePaginatedRows` client-slices full lists |
| **Why insufficient** | Does not scale; deep offsets slow |
| **Risks** | Timeouts; incomplete admin views |
| **Solution** | Keyset pagination on all list APIs; infinite scroll where UX needs |
| **Effort** | 15–25 person-days |
| **Performance** | High |
| **Maintainability** | Shared pagination contract |

## PERF-03 — Index hot financial queries

| Field | Detail |
|---|---|
| **Class** | **High** |
| **Current** | Good list indexes (0021); missing composites on `(collector_user_id, payment_date)`, `ledger_entries(loan_id)` |
| **Why insufficient** | Seq scans on collector day recon / loan ledger |
| **Risks** | Latency under load |
| **Solution** | Migration adding composites; keep Drizzle schema in sync |
| **Effort** | 2–4 person-days |
| **Performance** | High |
| **Security** | Neutral |
| **Maintainability** | Schema/migration alignment |

## PERF-04 — Redis + durable queue workers

| Field | Detail |
|---|---|
| **Class** | **High** before enterprise notification volume |
| **Current** | `redis: not_used`, `queue: in_process`, HTTP-triggered scheduler |
| **Why insufficient** | Jobs die with process; no DLQ |
| **Risks** | Lost SMS/email; missed schedules |
| **Solution** | Redis + BullMQ (or Neon-backed pg-boss if Redis denied); workers for mail/SMS/exports/scheduler |
| **Effort** | 15–30 person-days |
| **Performance** | Smooth peaks |
| **Security** | Isolate worker credentials |
| **Maintainability** | Clear job taxonomy |

## PERF-05 — Caching strategy

| Field | Detail |
|---|---|
| **Class** | **Medium** |
| **Current** | No app cache; SW caches shell only |
| **Solution** | Short TTL cache for settings, holidays, RBAC role maps; never cache money balances without invalidation |
| **Effort** | 8–15 person-days |
| **Performance** | Medium |
| **Security** | Avoid caching PII in shared Redis without encryption |
| **Maintainability** | Explicit invalidation rules |

## PERF-06 — Search indexing & archival

| Field | Detail |
|---|---|
| **Class** | **Medium** (search); **High** archival before multi-year 1M+ |
| **Current** | SQL filters; soft-delete; indefinite financial retention |
| **Solution** | Hot/warm/cold: archive closed loans >N years to cold storage; optional OpenSearch for borrower search |
| **Effort** | 20–40 person-days |
| **Performance** | Keeps hot DB small |
| **Security** | Retention policy compliance |
| **Maintainability** | Medium |

### Scale bottleneck estimate

| Scale | Likely first failure |
|---|---|
| 10k–100k rows | Dashboard/expense full scans; client-side pagination |
| 100k–1M | Unindexed date filters; pool connection saturation; KPI caps |
| 1M–10M | Needs read replicas, materialized KPIs, durable workers, archival |

---

# 5. Reliability

## REL-01 — Backup restore validation (drills)

| Field | Detail |
|---|---|
| **Class** | **Critical** for production trust |
| **Current** | Neon PITR documented; drills often unverified |
| **Why insufficient** | Untested restore is not a plan |
| **Risks** | Extended RTO/RPO miss |
| **Solution** | Quarterly restore to scratch DB + checksum report |
| **Effort** | 2–4 person-days setup + ops cadence |
| **Security** | Access-controlled scratch |
| **Maintainability** | Runbook |

## REL-02 — Dead letter queues + job retries

| Field | Detail |
|---|---|
| **Class** | **High** (with PERF-04) |
| **Current** | In-process setTimeout retries |
| **Solution** | BullMQ attempts + DLQ + admin replay UI |
| **Effort** | Included in PERF-04 |
| **Reliability** | High |

## REL-03 — Distributed locking

| Field | Detail |
|---|---|
| **Class** | **Medium** |
| **Current** | Optimistic `version` columns; DB uniqueness |
| **Why mostly sufficient** | Good for single-row money updates |
| **When needed** | Multi-instance workers on EOD/scheduler |
| **Solution** | Redis locks or `pg_try_advisory_lock` for jobs |
| **Effort** | 3–6 person-days |

## REL-04 — Offline sync hardening

| Field | Detail |
|---|---|
| **Class** | **High** for field ops growth |
| **Current** | localStorage queue + IndexedDB uploads + `/sync/offline/batch` |
| **Why insufficient** | localStorage size/corruption; large backlogs |
| **Risks** | Lost field collections |
| **Solution** | Prefer IndexedDB for queue; conflict UX; mandatory idempotency |
| **Effort** | 10–20 person-days |

## REL-05 — HA / failover

| Field | Detail |
|---|---|
| **Class** | **Medium** (Neon/Railway provide baseline); **High** for multi-region |
| **Current** | Single API service; Neon HA depends on plan |
| **Solution** | Multi-instance API behind Railway; health-gated deploys; document failover |
| **Effort** | 5–15 person-days + infra |

## REL-06 — Transaction isolation review

| Field | Detail |
|---|---|
| **Class** | **Medium** |
| **Current** | Default Postgres READ COMMITTED + optimistic versions |
| **Solution** | Document isolation; use `SELECT … FOR UPDATE` on pool row during disburse if contention appears |
| **Effort** | 3–8 person-days |

---

# 6. DevOps

## DO-01 — Unify Node versions (CI 22 vs Docker/deploy 20)

| Field | Detail |
|---|---|
| **Class** | **High** |
| **Current** | CI Node 22; Dockerfile/deploy Node 20 |
| **Risks** | “Works in CI” skew |
| **Solution** | Standardize on Node 22 LTS everywhere |
| **Effort** | 1–3 person-days |
| **Security** | Fewer surprise bugs |

## DO-02 — Observability (traces, metrics, log aggregation)

| Field | Detail |
|---|---|
| **Class** | **High** |
| **Current** | Structured logs; health JSON; limited APM |
| **Solution** | OpenTelemetry → vendor (Grafana/Honeycomb); RED metrics; money-path traces |
| **Effort** | 10–20 person-days |
| **Performance** | Sampling required |
| **Security** | Scrub PII from spans |
| **Maintainability** | Faster incident response |

## DO-03 — Canary / blue-green / feature flags

| Field | Detail |
|---|---|
| **Class** | **Medium** (flags High for risky financial changes) |
| **Current** | Manual prod workflow_dispatch; staging optional |
| **Solution** | Feature flags for GL dual-write & UI; canary Railway replica |
| **Effort** | 10–25 person-days |
| **Security** | Flag admin audited |

## DO-04 — Alerting dashboards

| Field | Detail |
|---|---|
| **Class** | **High** |
| **Current** | Health endpoint; ops docs |
| **Solution** | Alerts: health degraded, queue depth, payment error rate, balance drift, mail failure |
| **Effort** | 5–10 person-days |

## DO-05 — Rollback strategy documentation

| Field | Detail |
|---|---|
| **Class** | **Critical** for financial releases |
| **Current** | Deploy workflows exist; rollback narrative scattered |
| **Solution** | Single runbook: app rollback + migration forward-fix policy |
| **Effort** | 2–4 person-days |

---

# 7. Documentation, Code Quality, UI/UX

See dedicated reviews:

- [DOCUMENTATION_AUDIT.md](./DOCUMENTATION_AUDIT.md) — inventory, gaps, generated SSoT architecture
- [CODE_QUALITY_REVIEW.md](./CODE_QUALITY_REVIEW.md) — debt, large files, race risks
- [UI_UX_ENTERPRISE_REVIEW.md](./UI_UX_ENTERPRISE_REVIEW.md) — a11y, states, workflows

---

# 8. Priority stack (next engineering waves)

1. **Critical:** PERF-01 (SQL KPIs), FA-04 (mandatory idempotency), REL-01 (restore drills), DO-05 (rollback runbook)  
2. **High:** PERF-02/03/04, DA-03, SEC-03/04, FA-01/02 roadmap start, REL-04, DO-01/02/04  
3. **Medium:** DA-01/04/05/06, SEC-02/05, PERF-05/06, DO-03, FA-05 selective  
4. **Low:** SEC-06 HSM, microservices split, full-system event sourcing  

Roadmap packaging: [ENTERPRISE_ROADMAP_v14_v15_v20.md](./ENTERPRISE_ROADMAP_v14_v15_v20.md).
