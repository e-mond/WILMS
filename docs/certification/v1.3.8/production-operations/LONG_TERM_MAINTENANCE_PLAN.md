# Long-Term Maintenance Plan — WILMS v1.3.8 → v2.0

**Version:** 1.3.8 (planning baseline)  
**Last updated:** 2026-07-17  
**Horizon:** v1.4 – v2.0

## 1. Purpose

Roadmap for scaling, hardening, and enterprise maturity of WILMS production operations beyond v1.3.8. Items are **planned** unless marked implemented.

**Current baseline (v1.3.8):**

- Single Railway API service, in-process workers
- No Redis (`workers.redis: not_used`)
- Neon single primary (no read replicas in app)
- Prometheus endpoint available; Grafana not bundled
- No feature flag product

Aligns with `docs/certification/v1.3.8/enterprise-excellence/ROADMAP_v1.4_v2.0.md`.

---

## 2. v1.4 — Hardening & scale foundations

### 2.1 Durable queues (Redis + BullMQ)

| Item | Detail |
|------|--------|
| **Why** | API restart loses in-process jobs; multi-instance unsafe for background work |
| **Scope** | Mail dispatch, SMS, notification fan-out, scheduled jobs |
| **Infra** | Railway Redis or Upstash; `REDIS_URL` |
| **Code** | Replace in-process handlers; DLQ for failed jobs |
| **Ops** | Alert on queue depth; dashboard surface update |
| **Migration** | Blue/green cutover with feature flag |

### 2.2 OpenTelemetry + alerting

| Item | Detail |
|------|--------|
| Traces | Payment, disbursement, reversal, sync paths |
| Metrics | RED on API routes; scrape existing `/ops/metrics` |
| Logs | Correlate trace_id with `requestId` |
| Backend | Jaeger or vendor (Honeycomb, Datadog) |
| Alerts | Wire [PRODUCTION_ALERT_MATRIX.md](./PRODUCTION_ALERT_MATRIX.md) to Alertmanager |

### 2.3 Feature flags (new product capability)

| Item | Detail |
|------|--------|
| **Use cases** | GL dual-write, queue cutover, experimental UI |
| **Not in v1.3.8** | Use env toggles only for emergencies |
| **Recommendation** | LaunchDarkly, Unleash, or DB-backed flags with Super Admin UI |

### 2.4 Database scaling

| Item | Detail |
|------|--------|
| Read replicas | Neon read-only endpoint for reports/audit exports |
| Connection pooling | PgBouncer or Neon pooler; document max connections |
| Pagination | Cursor pagination on borrowers, payments, groups, expenses |
| Indexes | Continue hot-path indexes post-`0027` |

### 2.5 Platform unification

| Item | Detail |
|------|--------|
| Node 22 | Deploy workflow + Docker image (CI already on 22) |
| Automated PITR drill | Quarterly script in CI or ops cron |
| BFF request ID | Forward `X-Request-Id` Vercel → Railway |
| Sentry (optional) | DSN on frontend + API |

### 2.6 API maturity

- Mandatory `Idempotency-Key` on money POSTs
- OpenAPI generation from routes
- knip/madge CI gates for dead code

---

## 3. v1.5 — Accounting & policy

| Area | Initiative |
|------|------------|
| Ledger | GL dual-write + trial balance MVP |
| Monitoring | Balance drift detectors |
| Audit | Tamper-evident hash chain |
| AuthZ | ABAC / policy module |
| Compliance | Period close, audit export pack |
| Privacy | Field-level encryption for national ID (if required) |

**Ops impact:** New financial alerts; reconciliation runbooks; longer deploy validation.

---

## 4. v2.0 — Platform maturity

| Area | Initiative |
|------|------------|
| Accounting | GL authoritative for cash/P&L |
| Org model | Multi-branch / regional |
| Analytics | Forecasting, risk scoring (product) |
| Fraud | Heuristics on recon + GPS anomalies |
| Compliance | Reporting packs for NGO/bank/gov |
| Architecture | Optional service extract (Communications/Reporting) if scale demands |

---

## 5. Maintenance calendar (ongoing)

| Task | Frequency | Owner |
|------|-----------|-------|
| Dependency updates (security) | Monthly | Engineering |
| Neon PITR restore drill | Quarterly | DBA |
| Permission matrix audit | Per release | Security |
| Ops runbook review | Semi-annual | SRE |
| Cloudinary retention review | Annual | Ops |
| Secret rotation | Annual or on event | Security |
| Load test (staging) | Before major releases | Engineering |

---

## 6. Scaling triggers

| Signal | Action |
|--------|--------|
| API p95 &gt; 2s sustained | Neon query tuning; read replica for reports |
| Railway CPU &gt; 70% sustained | Scale compute; plan v1.4 queues |
| Connection pool exhaustion | Neon pooler; reduce connection leak |
| Mail/SMS backlog after restarts | Prioritize Redis/BullMQ (v1.4) |
| &gt; 50 concurrent field collectors | PWA CDN review; API horizontal scale + sticky-less reads |

---

## 7. Technical debt linked to ops

| Debt | Risk | Target |
|------|------|--------|
| In-process workers | Job loss on restart | v1.4 |
| No feature flags | Rollback-only mitigations | v1.4 |
| Node 20 in deploy workflow | Version skew | v1.4 |
| Frontend prod logging NoOp | Blind to client errors | v1.4 Sentry |
| Gmail/Vercel mail relay | Dual-platform coupling | Evaluate Resend primary |

---

## 8. Document maintenance

Update this plan when:

- v1.4 queue migration ships
- Read replicas go live
- SLOs are defined and measured
- Organizational RTO/RPO contracts change

## 9. Related docs

- [ENTERPRISE_OPERATIONS_GUIDE.md](./ENTERPRISE_OPERATIONS_GUIDE.md)
- [BACKUP_AND_RECOVERY_PLAN.md](./BACKUP_AND_RECOVERY_PLAN.md)
- [docs/certification/v1.3.8/enterprise-excellence/ROADMAP_v1.4_v2.0.md](../../enterprise-excellence/ROADMAP_v1.4_v2.0.md)
