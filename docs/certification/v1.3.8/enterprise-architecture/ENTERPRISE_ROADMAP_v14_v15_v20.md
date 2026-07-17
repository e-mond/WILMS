# WILMS Enterprise Roadmap — v1.4 / v1.5 / v2.0

**Date:** 17 July 2026  
**Basis:** Phase 17 architecture review + v1.3.8 Critical/High financial remediation  
**Sizing:** Complexity / person-days — not calendar commitments

---

## Guiding principles

1. **Money integrity before features.**
2. **Modular monolith until a context must scale independently.**
3. **Operational ledger + GL dual-write** — do not big-bang rewrite field ops.
4. **SQL-derived KPIs** before Redis bling.
5. **Every financial change ships with audit evidence.**

---

## v1.4 — Enterprise Hardening (integrity & scale foundations)

**Theme:** Make current production trustworthy at growth without statutory GL yet.

### Architecture

| Item | Class | Notes |
|---|---|---|
| SQL aggregate dashboards / remove 2000-row KPI trap | Critical | PERF-01 |
| Mandatory Idempotency-Key on money POSTs | Critical | FA-04 |
| Composite indexes (collector+date, ledger loan_id) | High | PERF-03 |
| Cursor/keyset pagination on core lists | High | PERF-02 |
| Outbox table for domain events (prep) | Medium | DA-06 |
| ADR: modular monolith decision | High | DA-02 |

### Security

| Item | Class |
|---|---|
| Session secret rotation runbook | High |
| Audit hash-chain (tamper-evident) design + MVP | High |
| Override TTL + access review export | Medium |

### Performance / reliability

| Item | Class |
|---|---|
| Redis + BullMQ for mail/SMS/exports/scheduler | High |
| DLQ + admin replay | High |
| Quarterly backup restore drill automation | Critical |
| Offline queue → IndexedDB | High |

### DevOps

| Item | Class |
|---|---|
| Unify Node 22 everywhere | High |
| OpenTelemetry traces on money paths | High |
| Rollback runbook single SSoT | Critical |
| Alerting on health degraded / queue depth / payment 5xx | High |

### Features (only if integrity allows)

- Improved recon resubmit UX
- Collector performance views from SQL
- Documentation index + system architecture SSoT

### Tech debt

- Split `settings/service.ts` / large modules
- Remove payment edit dead paths
- Sync Drizzle schema indexes with SQL migrations

### Enterprise readiness milestone

**M1:** KPI totals match SQL for orgs up to ~100k payments; restore drill passed; idempotent money API.

---

## v1.5 — Enterprise Accounting & Policy

**Theme:** Banking-partner credible books + configurable controls.

### Architecture / financial

| Item | Class |
|---|---|
| GL schema + posting rules + dual-write (flagged) | High |
| Trial balance + period close MVP | High |
| Balance drift monitor (loan vs ledger vs GL) | High |
| Lightweight approval workflow table | Medium |
| Versioned business policy documents | Medium |
| CQRS read models / materialized daily KPIs | High |

### Security

| Field-level encryption for national ID / phone | Medium–High |
| Policy/ABAC module wrapping access helpers | High |
| Signed financial export manifests | High |

### Infrastructure

| Read replica for reports (if Neon plan allows) | Medium |
| Data archival policy for closed loans | High |
| Feature flags for GL and risky UX | Medium |

### Features

- Financial audit export pack
- Admin GL inquiry screens (read-only)
- Access certification report for auditors
- Communication worker isolation complete

### Enterprise readiness milestone

**M2:** Staging month-end TB balances; 30 days zero drift; partner can review GL export pack.

---

## v2.0 — World-class platform

**Theme:** GL authoritative for cash/P&L; multi-branch ready; inspectable.

### Architecture

| Item | Class |
|---|---|
| GL cutover as books-of-record for cash & P&L | High→Critical at cutover |
| Loan balance as verified projection | High |
| Optional loan-aggregate event stream for disputes | Medium |
| Extract Communications or Reporting worker/service **only if** scale demands | Medium |
| Rule engine for fees/holidays/thresholds | Medium |

### Security

| HSM/KMS if partner/regulator requires | Low–High (contract-driven) |
| Full ABAC attributes: branch, amount band, time | High |

### Scale

| 1M+ row playbook: archival, search index, replicas | High |
| Infinite scroll + virtualized tables org-wide | Medium |

### Product (examples — not commitments)

- Multi-branch / multi-pool org hierarchy
- Advanced portfolio analytics
- Borrower self-service (if BRD expands)
- Deeper offline-first field app

### Enterprise readiness milestone

**M3:** Independent financial + security audit against GL exports and signed audit chain; scale test to agreed volume; unconditional enterprise certification criteria met.

---

## Explicit non-goals (through v1.5)

- Microservices mesh
- Rewriting frontend in another framework
- Full-system event sourcing
- Replacing HMAC sessions with JWT without threat-model ADR
- Cryptocurrency / exotic ledgers

---

## Dependency graph (simplified)

```text
v1.4 SQL KPIs + idempotency + queues + restore drills
        │
        ▼
v1.5 GL dual-write + TB + drift + ABAC/policy
        │
        ▼
v2.0 GL authoritative + multi-branch + scale 1M+
```
