# WILMS v1.4 Roadmap — Enterprise Hardening

**Date:** 17 July 2026  
**Phase:** 24.2 / 24.3  
**Theme:** Make production trustworthy at growth **without** statutory GL yet  
**Sizing:** Person-days of focused senior engineering — not calendar commitments  
**Extends:** [`ENTERPRISE_ROADMAP_v14_v15_v20.md`](../../certification/v1.3.8/enterprise-architecture/ENTERPRISE_ROADMAP_v14_v15_v20.md)

---

## v1.4 mission statement

v1.4 hardens the **operational microfinance platform** WILMS already is: field collection, pool treasury, reconciliation, and executive KPIs — at scales up to ~100k payments with correct totals, durable background work, and inspectable operations. It does **not** attempt to become SAP on day one.

**Enterprise readiness milestone M1:** KPI totals match SQL for orgs up to ~100k payments; restore drill passed; idempotent money API; durable job queue operational.

---

## v1.4 objectives (ranked)

| # | Objective | Success metric | Priority |
|---|-----------|----------------|----------|
| O1 | Money API idempotency | 100% money POSTs require `Idempotency-Key`; zero duplicate posts in chaos test | **P0** |
| O2 | Durable background workers | Redis + BullMQ for mail/SMS/exports/scheduler; DLQ + admin replay | **P0** |
| O3 | List scalability | Cursor/keyset pagination on borrowers, payments, loans, groups, expenses | **P0** |
| O4 | Observability | OpenTelemetry traces on money paths; Prometheus extends `/ops/metrics` | **P0** |
| O5 | Reliability ops | Quarterly automated restore drill; rollback runbook SSoT | **P0** |
| O6 | Event infrastructure prep | Outbox table + publisher for domain events | **P1** |
| O7 | Feature flags (GL prep) | Env/DB-backed flags for v1.5 GL dual-write | **P1** |
| O8 | Runtime unify | Node 22 everywhere (CI, Railway, Vercel, local) | **P1** |
| O9 | Offline resilience | Payment/expense queue → IndexedDB (upload queue partial today) | **P1** |
| O10 | Developer velocity | OpenAPI generation; knip/madge CI gates | **P2** |

---

## v1.4 feature backlog

### P0 — Must ship

| ID | Feature | Effort (pd) | Dependencies | Risk |
|----|---------|-------------|--------------|------|
| FA-04 | Mandatory `Idempotency-Key` on money POSTs (payment, disburse, reversal, recon, adjustment, loan create) | 4–6 | Frontend + offline queue emit keys first | Mobile retry storms if rolled out API-only |
| REL-02 | Redis + BullMQ workers: mail, SMS, export jobs, scheduler ticks | 12–18 | Railway Redis addon; worker process or shared consumer | Cutover window for in-flight jobs |
| PERF-02 | Cursor pagination (`?cursor=&limit=`) on high-volume lists | 10–15 | Composite indexes (0027 started) | Breaking change for clients assuming offset |
| OBS-01 | OpenTelemetry + Prometheus (extend existing `/ops/metrics`) | 8–12 | `WILMS_METRICS_TOKEN` prod setup | Cardinality explosion if unbounded labels |
| REL-01 | Quarterly backup restore drill automation + evidence artifact | 5–8 | Neon API or runbook script | None — pure ops win |
| DO-05 | Rollback runbook single SSoT (merge existing docs) | 2–3 | None | Low |

### P1 — Should ship in v1.4

| ID | Feature | Effort (pd) | Dependencies | Risk |
|----|---------|-------------|--------------|------|
| DA-06 | Outbox pattern: `domain_outbox` table + transactional insert + poller | 8–12 | BullMQ for delivery | At-least-once consumers must be idempotent |
| DO-03 | Feature flag service (DB + env); `gl_dual_write` flag stub for v1.5 | 5–8 | None | Flag sprawl without naming convention |
| OFF-01 | Offline queue IndexedDB migration (payments/expenses) | 6–10 | FA-04 idempotency keys | Data migration from localStorage |
| DA-02 | ADR: modular monolith decision (formalize) | 1–2 | Architecture review | None |
| SEC-02 | Audit hash-chain design + MVP (tamper-evident) | 10–15 | None | Performance on hot audit path |
| PERF-03 | Remaining composite indexes; Drizzle ↔ SQL sync | 3–5 | DBA review on Neon | Lock time on large tables |
| DO-01 | Node 22 unify (engines, CI, Docker if any) | 2–4 | Vercel/Railway image support | Native module rebuild |

### P2 — v1.4 if capacity; else early v1.5

| ID | Feature | Effort (pd) | Notes |
|----|---------|-------------|-------|
| DA-01 | Split `settings/service.ts` (~1.4k LOC) | 8–12 | Treasury/settings bounded context extraction |
| UX-02 | Collector performance SQL views | 5–8 | Replaces list-bound segments |
| DOC-01 | Documentation index + architecture SSoT link | 3–5 | Points to this planning folder |
| DX-01 | OpenAPI spec generation from routes | 6–10 | Contract tests |
| DX-02 | knip + madge in CI | 3–5 | Dead code / circular dep gates |

### Explicitly deferred (not v1.4)

| Item | Target | Rationale |
|------|--------|-----------|
| Borrower self-service portal | **v1.5+ product decision** | Not core to field ops hardening |
| GL dual-write (authoritative) | v1.5 | Schema prep only via flags in v1.4 |
| ABAC policy engine | v1.5 | RBAC sufficient for current org model |
| Multi-branch org hierarchy | v2.0 | No schema today |
| Microservices extract | Never unless forced | See non-goals |

---

## Architecture changes (v1.4)

```text
┌─────────────────────────────────────────────────────────────┐
│  Next.js BFF (Vercel) — CSRF, session proxy                │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Express API (Railway) — modular monolith                     │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Money cmds  │  │ List queries │  │ Ops /health/metrics │  │
│  │ + idempotency│  │ cursor pages │  │ + OTel middleware   │  │
│  └──────┬──────┘  └──────────────┘  └─────────────────────┘  │
│         │ insert                                                │
│         ▼                                                       │
│  ┌─────────────┐     ┌──────────────┐                          │
│  │ domain_outbox│────►│ BullMQ jobs  │                          │
│  └─────────────┘     └──────┬───────┘                          │
└─────────────────────────────┼──────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────────┐
   │ Neon PG  │        │  Redis   │        │ Worker proc  │
   │          │        │  BullMQ  │        │ mail/SMS/exp │
   └──────────┘        └──────────┘        └──────────────┘
```

**No change:** Single API deployment model, HMAC sessions, Neon primary DB, Cloudinary uploads.

---

## Platform evolution recommendations (Phase 24.3)

Only items justified for WILMS women's interest-free microfinance operations.

| Capability | Why | Benefits | Trade-offs | Complexity (pd) | Priority |
|------------|-----|----------|------------|-----------------|----------|
| **Redis** | In-process jobs die on API restart; multi-instance unsafe | Durable queue backing; session cache option later | New infra cost (~$10–30/mo); ops runbook | 3–5 (provision + wiring) | **P0** |
| **BullMQ** | Need DLQ, retries, delayed jobs for mail/SMS/exports | Production-grade worker semantics; admin replay | Redis dependency; worker deploy model | 12–18 | **P0** |
| **OpenTelemetry** | `/ops/metrics` alone cannot trace money path failures | End-to-end payment latency; partner SRE credibility | Collector hosting; sampling discipline | 8–12 | **P0** |
| **Prometheus/Grafana** | Existing `/ops/metrics` is a start; need dashboards + alerts | SLO tracking; queue depth; 5xx budgets | `WILMS_METRICS_TOKEN` secret mgmt | 5–8 (extend existing) | **P0** |
| **Feature flags** | GL dual-write and risky UX need safe rollback | Gradual rollout; kill switch without redeploy | Flag debt; test matrix explosion | 5–8 | **P1** |
| **Outbox pattern** | Audit + future GL posts must not fire-and-forget | Transactional consistency with domain events | Polling lag; idempotent consumers | 8–12 | **P1** |
| **Cursor pagination** | `MAX_UNPAGINATED_LIST_ROWS = 2000` in `list-pagination.ts` silently truncates | Stable performance at depth; correct totals | Client migration from offset | 10–15 | **P0** |
| **Mandatory idempotency** | Optional key today — mobile retry = duplicate money risk | Hard guarantee against double-post | Client must generate UUIDs | 4–6 | **P0** |
| **Node 22 unify** | CI/local/prod skew (engines `>=20`) | Single runtime; security patches aligned | Minor dep bumps | 2–4 | **P1** |
| **CQRS read models** | Dashboard SQL fixed for collections; lists still heavy | Correct KPIs at scale; API CPU relief | Second query path to maintain | 10–20 (partial in v1.4) | **P1** |
| **Double-entry GL** | Operational ledger ≠ statutory books | Banking partner credibility | 60–105 pd — **v1.5**, not v1.4 | 25–40 (Phase A schema only) | **P2** (prep) |
| **ABAC** | RBAC + overrides sufficient for single-org today | Branch/amount policies later | Policy authoring UX | 20–30 | **P3** (v1.5) |
| **Workflow engine** | Hand-coded lifecycle works for current approval depth | Maker-checker expansion | Over-engineering risk | 20–40 | **P3** (v1.5) |
| **Event bus** | Outbox + BullMQ covers v1.4 needs | Decoupled integrations later | Kafka/ NATS ops burden unjustified now | 15–25 | **P3** |
| **Object storage abstraction** | Cloudinary works; single provider | Multi-cloud portability | Abstraction layer maintenance | 8–12 | **P3** |
| **Secrets rotation** | Session secret manual rotation immature | Reduced breach blast radius | Dual-secret window complexity | 5–8 | **P2** |
| **Horizontal scaling** | Single Railway instance OK until ~500 concurrent collectors | HA API | In-process jobs blocked until Redis | 5–10 (after queues) | **P2** |
| **Multi-tenancy** | WILMS is single-org deployed per sponsor today | SaaS economics | Schema isolation; noisy neighbor | 40–80 | **P3** (v2.0+) |
| **Multi-branch** | No org-unit model in schema | Regional ops | ABAC + reporting dimension explosion | 30–50 | **P3** (v2.0) |
| **Offline sync** | Collectors work low-connectivity | Field reliability | Conflict resolution UX | 6–10 (IndexedDB v1.4) | **P1** |
| **Mobile app** | PWA + responsive web sufficient for v1.4 | Native GPS/camera polish | App store lifecycle | 60–120 | **P3** (product) |
| **AI reporting** | Human-approved assist only; never auto-post money | Draft narratives for auditors | Hallucination risk; partner trust | 15–25 | **P3** (v2.0) |

**Not recommended for WILMS now:** Microservices mesh, full event sourcing, JWT replacement without ADR, cryptocurrency ledgers.

---

## Migration plan (v1.3.8 → v1.4.0)

| Step | Action | Rollback |
|------|--------|----------|
| 1 | Deploy Redis; run BullMQ workers in shadow (log-only) | Disable worker env flag |
| 2 | Migrate mail/SMS/scheduler to BullMQ | Feature flag `queue_backend=bullmq\|in_process` |
| 3 | Ship cursor pagination API; update frontend list hooks | API version param if needed |
| 4 | Enforce idempotency (422) after frontend + offline queue ship keys | Temporary env override (staging only) |
| 5 | Enable OTel exporter; wire Grafana dashboards | Disable exporter |
| 6 | Create outbox table; dual-write events (no external consumers yet) | Stop poller |
| 7 | Tag `v1.4.0`; LTS clock for v1.3.x starts | Rollback runbook |

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Redis outage blocks notifications | Medium | High | Fallback to sync send for critical alerts; health surface degraded |
| Idempotency rollout breaks offline collectors | Medium | High | Ship frontend first; grace period with warning header |
| Cursor pagination breaks integrations | Low | Medium | Document migration; keep offset deprecated 1 release |
| Team capacity underestimates GL prep overlap | Medium | Medium | GL schema design in Phase 24.6 only — no v1.4 implementation |
| Production cert delayed — maintenance branch confusion | High | Low | This doc + V13_MAINTENANCE_STRATEGY.md gate branch creation |

---

## Dependencies

```text
Production cert (operator) ──► maintenance branch (optional for v1.4 dev)
        │
        ▼
FA-04 idempotency ◄── OFF-01 offline IndexedDB
        │
        ▼
REL-02 Redis/BullMQ ◄── DA-06 outbox poller
        │
        ├──► OBS-01 OTel (money middleware)
        └──► DO-03 feature flags (gl_dual_write stub)
        │
        ▼
PERF-02 cursor pagination ◄── PERF-03 indexes (0027+)
        │
        ▼
M1 milestone ──► v1.5 GL Phase A
```

---

## Effort summary

| Category | Person-days |
|----------|-------------|
| P0 backlog | 41–62 |
| P1 backlog | 37–57 |
| P2 backlog | 25–40 |
| **v1.4 total (realistic)** | **80–120** |

Assumes 1–2 senior engineers; does not include operator certification or accountant GL review.

---

## v1.4 non-goals (reaffirmed)

- Microservices mesh
- Next.js framework rewrite
- Borrower portal as core deliverable
- GL authoritative for cash/P&L
- Multi-branch org model
- Cryptocurrency
