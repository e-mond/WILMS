# Operations Roadmap — Phase 24.8

**Date:** 17 July 2026  
**Extends:** [`ENTERPRISE_OPERATIONS_GUIDE.md`](../../certification/v1.3.8/production-operations/ENTERPRISE_OPERATIONS_GUIDE.md), [`SYSTEM_MONITORING_GUIDE.md`](../../certification/v1.3.8/production-operations/SYSTEM_MONITORING_GUIDE.md)  
**v1.3.8 baseline:** Vercel + Railway + Neon; `/ops` dashboard; `/ops/metrics` Prometheus text (auth required)

---

## Operations mission (v1.4)

Transform WILMS from **"we can curl /health"** to **SRE-partner credible**: traces on money paths, alertable metrics, tested disaster recovery, defined support tiers.

---

## Current observability inventory

| Capability | v1.3.8 | Gap |
|------------|--------|-----|
| Health endpoint | `/health` JSON | No SLO linkage |
| Ops dashboard | `/ops` Super Admin UI | Human-only; no automation |
| Prometheus metrics | `GET /ops/metrics` (Bearer token) | **Pending:** prod token unset; no Grafana |
| Structured logs | Railway logs | No trace correlation |
| Distributed tracing | None | **v1.4 OTel** |
| Alerting | Manual | **v1.4 alert matrix automation** |
| Restore drill | Documented | **Not automated** |

---

## v1.4 observability stack

```text
Express API ──► OTel SDK ──► OTLP exporter ──► Collector
      │                                              │
      ├──► /ops/metrics (Prometheus) ◄── Grafana ────┤
      └──► Structured logs (JSON) ──► Railway logs
```

### OpenTelemetry

| Field | Detail |
|-------|--------|
| **Why** | Payment failures need span-level diagnosis across BFF→API→DB |
| **Benefits** | p95 latency by route; error attribution; partner due diligence |
| **Trade-offs** | Collector cost; sampling config; PII in spans — scrub bodies |
| **Complexity** | 8–12 pd |
| **Priority** | **P0** |

**Instrument first:** `POST /payments`, disburse, reversal, recon submit.

### Prometheus + Grafana

| Field | Detail |
|-------|--------|
| **Why** | Extend existing `/ops/metrics` — do not replace |
| **Benefits** | Dashboards: queue depth, 5xx rate, DB pool, payment latency |
| **Trade-offs** | `WILMS_METRICS_TOKEN` rotation; scrape auth |
| **Complexity** | 5–8 pd (dashboards + alerts) |
| **Priority** | **P0** |

**New metrics (v1.4):**

| Metric | Source |
|--------|--------|
| `wilms_queue_depth{queue}` | BullMQ |
| `wilms_queue_failed_total` | BullMQ DLQ |
| `wilms_payment_post_duration_seconds` | OTel histogram |
| `wilms_idempotency_replay_total` | API middleware |
| `wilms_db_pool_waiting` | pg pool |

---

## Alert matrix (v1.4)

| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| API down | `/health` != 200 for 2m | P1 | Pager + SMS |
| Payment 5xx spike | >5% 5xx on money routes 5m | P0 | Pager |
| Queue depth | `wilms_queue_depth` > 1000 for 15m | P2 | Slack |
| DLQ growth | `wilms_queue_failed_total` increase | P2 | Slack |
| DB degraded | health.database != connected | P1 | Pager |
| Negative operating cash | ops financial alert | P2 | Email admin |
| Disk/memory | Railway limits | P2 | Slack |

**Pending v1.3.8 closure:** Authenticated `/ops/metrics` scrape with `WILMS_METRICS_TOKEN` in production.

---

## Disaster recovery

| Scenario | v1.3.8 | v1.4 target |
|----------|--------|-------------|
| Neon PITR restore | Documented in ops guides | **Quarterly automated drill** + evidence artifact |
| API bad deploy | Railway rollback | Rollback runbook SSoT |
| Redis loss | N/A | Queue paused; alert; jobs replay from outbox |
| Vercel frontend bad deploy | Instant rollback | Same |
| Secret compromise | Manual rotation | Rotation runbook + dual-secret window |

### Restore drill automation

| Field | Detail |
|-------|--------|
| **Why** | REL-01 Critical — untested backups are fiction |
| **Benefits** | Audit evidence; confidence in RPO/RTO |
| **Trade-offs** | Neon branch cost; script maintenance |
| **Complexity** | 5–8 pd |
| **Priority** | **P0** |

**RPO/RTO targets (v1.4):**

| Metric | Target |
|--------|--------|
| RPO | ≤ 1 hour (Neon PITR) |
| RTO | ≤ 4 hours (documented runbook) |

---

## SLA framework (proposed)

| Tier | Availability | Support hours | Response P0 | Audience |
|------|--------------|---------------|-------------|----------|
| **Community** | Best effort | None | N/A | Open-source fork |
| **Standard** | 99.5% monthly | Business hours GMT | 8h | Single-org NGO |
| **Professional** | 99.9% monthly | Extended | 4h | Bank-backed MFI |
| **Enterprise** | 99.95% | 24×5 | 1h | Multi-site (v2.0) |

**v1.4 realistic SLA:** Standard tier for first production sponsor; document honestly in support manual.

---

## Support tiers

| Tier | Includes | Excludes |
|------|----------|----------|
| L1 | Password reset, user provisioning, "how do I" | Schema changes |
| L2 | Payment investigation, recon guidance, export help | Code deploy |
| L3 | Engineering on-call, hotfix, DB restore | Feature requests |
| L4 | Architecture, GL accountant liaison | Custom ERP integrations |

**Escalation:** L1 → L2 within 4h; money integrity → L3 immediately.

---

## Infrastructure evolution

| Component | v1.3.8 | v1.4 | v2.0 |
|-----------|--------|------|------|
| API | Railway single instance | + horizontal option post-Redis | Multi-instance |
| Workers | In-process | Dedicated BullMQ worker service | Same |
| Redis | None | Railway Redis | Same |
| DB | Neon primary | Same | + read replica |
| Secrets | Env vars | Rotation runbook | KMS if partner requires |
| Feature flags | None | DB-backed | Same |

---

## Runbooks (v1.4 deliverables)

| Runbook | Status | Action |
|---------|--------|--------|
| Rollback | Exists (fragmented) | Merge to SSoT — DO-05 |
| Incident response | [`INCIDENT_RESPONSE_PLAYBOOK.md`](../../certification/v1.3.8/production-operations/INCIDENT_RESPONSE_PLAYBOOK.md) | Add Redis/BullMQ section |
| Restore drill | Partial | Automate + evidence template |
| Secret rotation | Missing | v1.4 write |
| Queue DLQ replay | N/A until BullMQ | v1.4 write |

---

## Operations effort summary

| Workstream | Effort (pd) | Priority |
|------------|-------------|----------|
| OTel instrumentation | 8–12 | **P0** |
| Grafana + alerts | 5–8 | **P0** |
| Restore drill automation | 5–8 | **P0** |
| Rollback SSoT | 2–3 | **P0** |
| Secret rotation runbook | 5–8 | **P2** |
| SLA/support doc update | 2–3 | **P2** |

---

## Non-goals (v1.4 ops)

- Multi-region active-active
- Self-hosted Kubernetes
- 24×7 dedicated NOC
- SIEM integration (unless sponsor contract)

---

## References

- [`POST_DEPLOYMENT_MONITORING_PLAN.md`](../../certification/v1.3.8/production-cutover/POST_DEPLOYMENT_MONITORING_PLAN.md)
- [`PRODUCTION_ALERT_MATRIX.md`](../../certification/v1.3.8/production-operations/PRODUCTION_ALERT_MATRIX.md)
- [`LONG_TERM_MAINTENANCE_PLAN.md`](../../certification/v1.3.8/production-operations/LONG_TERM_MAINTENANCE_PLAN.md)
