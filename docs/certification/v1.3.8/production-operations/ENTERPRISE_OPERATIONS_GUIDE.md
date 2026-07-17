# Enterprise Operations Guide — WILMS v1.3.8

**Version:** 1.3.8  
**Last updated:** 2026-07-17  
**Audience:** SRE, DevOps, engineering leadership

## 1. Operating model

WILMS production operations follow a **lean SRE model** appropriate for a small-to-medium NGO/fintech deployment:

| Pillar | v1.3.8 state | Target maturity |
|--------|--------------|-----------------|
| **Reliability** | Platform health checks, smoke tests, manual rollback | SLOs + error budgets (v1.4) |
| **Observability** | Request IDs, JSON logs, `/ops` + Prometheus endpoint | OTel + Grafana (v1.4) |
| **Change management** | GitHub Actions gated deploy, Drizzle migrations | Feature flags (v1.4) |
| **Security** | RBAC, CSRF, rate limits, audit log | ABAC, hash-chain audit (v1.5) |
| **Recovery** | Neon PITR, documented RTO/RPO targets | Quarterly automated drills (v1.4) |

This is **not** a Fortune-500 fully wired observability stack. The guide defines how to operate responsibly within current capabilities and what to build next.

## 2. Service ownership

| Service | Owner | Platform SLA dependency |
|---------|-------|-------------------------|
| Frontend (BFF + UI) | Frontend team | Vercel |
| API | Backend team | Railway |
| PostgreSQL | DBA / backend | Neon |
| Uploads | Backend team | Cloudinary |
| Mail relay | Platform / backend | Vercel + Gmail/Resend |
| SMS | Backend team | SMSNotifyGH / etc. |

**On-call rotation:** Minimum one engineer with Railway, Vercel, Neon, and GitHub Actions access.

## 3. Change windows

| Change type | Window | Approval |
|-------------|--------|----------|
| Standard release | Business hours (local) | Engineering lead |
| Migration with DDL | Low-traffic window + backup | Engineering + Super Admin |
| Emergency hotfix | Any time | Incident commander |
| Secret rotation | Any time | Security owner |

Avoid Friday deploys without on-call coverage.

## 4. Deployment pipeline

```
PR → CI (type-check, lint, tests, budgets)
  → merge main
  → (optional) staging auto-deploy
  → manual workflow_dispatch production (confirm=deploy)
  → migrate → Railway → Vercel → smoke
```

**Concurrency:** Single production deploy group; no cancel-in-progress.

**Node version note:** CI uses Node 22; deploy workflow uses Node 20. Unify on Node 22 in v1.4.

## 5. Environment strategy

| Environment | Purpose | Data |
|-------------|---------|------|
| Local | Dev | In-memory or local Postgres |
| Staging | Pre-prod validation | Staging Neon branch |
| Production | Live | Neon primary |

Staging enabled via `ENABLE_STAGING_DEPLOY=true` repo variable.

## 6. Observability standards

### Logging

- API: JSON structured logs with `requestId`, `service: wilms-api`
- Retention: Railway log retention per plan; export for incidents
- Frontend production: NoOp logger (no client log shipping in v1.3.8)

### Metrics

- Scrape `GET /api/v1/ops/metrics` with `WILMS_METRICS_TOKEN`
- Do not expose metrics publicly without auth

### Tracing

- **Not implemented.** Recommend OpenTelemetry on payment, disbursement, reversal paths in v1.4.

### Dashboards

| Dashboard | Tool | v1.3.8 |
|-----------|------|--------|
| Ops surfaces | WILMS `/ops` | Yes |
| Infrastructure | Railway / Vercel / Neon | Yes |
| RED metrics | Grafana + Prometheus | Recommended |
| Business KPIs | WILMS reports | Yes |

## 7. Incident management

Follow [INCIDENT_RESPONSE_PLAYBOOK.md](./INCIDENT_RESPONSE_PLAYBOOK.md).

| Practice | Requirement |
|----------|-------------|
| Severity classification | P1–P4 |
| Communication | Incident channel + stakeholder updates |
| Blameless postmortem | Within 5 business days for P1/P2 |
| Runbook updates | PR to ops pack when gaps found |

## 8. Security operations

| Activity | Frequency |
|----------|-----------|
| `npm audit` (critical) | Every CI run |
| Secret scan (gitleaks) | Every CI run |
| RBAC smoke | Every production deploy |
| Permission matrix review | Each release |
| Session secret rotation | Annual or on compromise |
| Access review (Super Admin accounts) | Quarterly |

## 9. Data governance

- Financial data in Neon; PII in users/borrowers tables
- Audit log immutable — no deletes
- User deletion: anonymization for active users; hard delete for invited only
- Exports: role-gated; auditor can export reports

## 10. Capacity and scaling (v1.3.8)

| Layer | Current | Limit |
|-------|---------|-------|
| API | Single Railway service | Vertical scale; stateless except in-process jobs |
| DB | Neon serverless Postgres | Connection limits; use indexes (`0027`) |
| Frontend | Vercel serverless | Auto-scale |
| Redis | Not used | N/A |

Horizontal API replicas **without** sticky sessions are safe for read traffic; write contention is DB-bound. Durable queues required before multi-instance background work (v1.4).

## 11. Compliance and audit

| Requirement | Mechanism |
|-------------|-----------|
| Who did what | Audit log |
| Financial traceability | Ledger entries, payments, reversals |
| Release traceability | Git tags, `verify:deploy-sync`, health `gitCommit` |
| Certification artifacts | `docs/certification/v1.3.8/` |

## 12. Roadmap alignment

See [LONG_TERM_MAINTENANCE_PLAN.md](./LONG_TERM_MAINTENANCE_PLAN.md) and `docs/certification/v1.3.8/enterprise-excellence/ROADMAP_v1.4_v2.0.md`.

**v1.4 priorities for ops:** Redis/BullMQ, OpenTelemetry, feature flags, Node 22 everywhere, automated restore drills.

## 13. Document hierarchy

1. This guide — operating model
2. [PRODUCTION_OPERATIONS_MANUAL.md](./PRODUCTION_OPERATIONS_MANUAL.md) — day-to-day
3. Runbooks (deploy, rollback, backup, incident)
4. [docs/operations/](../../../operations/) — quick reference

## 14. Related docs

- [PRODUCTION_SUPPORT_MANUAL.md](./PRODUCTION_SUPPORT_MANUAL.md)
- [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md)
- [security-guide.md](../../../security-guide.md)
