# Operations Signoff — WILMS v1.3.8 Go-Live

**Date:** 17 July 2026  
**Scope:** Production operability evidence from public probes + documented ops posture  
**Formal ops sign-off:** **Pending**

---

## Summary

| Area | Result |
|------|--------|
| API operational (`/health` ok) | **PASS** |
| Database connected | **PASS** |
| Integrations configured (mail, SMS, uploads) | **PASS** |
| Version alignment (`1.3.8`) | **PASS** |
| Request ID present | **PASS** |
| Anonymous metrics blocked | **PASS** |
| Authenticated `/ops/metrics` scrape | **Pending** |
| External uptime monitoring | **Pending** |
| Prometheus/Grafana configured | **Pending** |
| Incident drill / on-call roster | **Pending** |
| Named Operations Owner signature | **Pending** |

---

## Production operability (health evidence)

**Source:** `evidence/prod-health-20260717T170225Z.json`

| Signal | Value | Ops implication |
|--------|-------|-----------------|
| `status` | `ok` | Service accepting traffic |
| `degradedReasons` | `[]` | No active degradation flags |
| `database.status` | `connected` | Data layer reachable |
| `schema.status` | `ok` | No missing tables |
| `migrations.status` | `ok` | Schema revision current (watermark) |
| `uploads.valid` | `true` | File uploads operational |
| `integrations.mail.configured` | `true` | Email channel ready |
| `integrations.sms.configured` | `true` | SMS channel ready |

---

## Worker / queue posture (accepted)

| Component | Production value | Ops note |
|-----------|------------------|----------|
| `workers.redis` | `not_used` | No Redis dependency in prod |
| `workers.queue` | `in_process` | Jobs run in API process — restart clears in-flight |
| `workers.scheduler` | `http_triggered` | Requires external cron hitting trigger URL |

**Accepted for v1.3.8** per RC validation conditions. Track durable queue for v1.4.

Reference: `docs/certification/v1.3.8/production-operations/ENTERPRISE_OPERATIONS_GUIDE.md`

---

## Observability

### Confirmed this session

| Capability | Evidence | Status |
|------------|----------|--------|
| `X-Request-Id` on API responses | `evidence/api-response-headers.txt` | **PASS** |
| `/health` diagnostic payload | `evidence/prod-health-*.json` | **PASS** |
| `/ops/metrics` auth gate | HTTP 401 anonymous | **PASS** |

### Pending

| Capability | Status | Required evidence |
|------------|--------|-------------------|
| `WILMS_METRICS_TOKEN` set on Railway | **Pending** | Env export |
| Prometheus scrape of `/ops/metrics` | **Pending** | Scrape config + sample metrics |
| Grafana dashboards | **Pending** | Dashboard URL or export |
| External uptime probe (e.g. `/health`) | **Pending** | Provider config screenshot |
| Log aggregation (Railway logs → SIEM) | **Pending** | Integration doc |

Reference: `docs/certification/v1.3.8/production-operations/OPERATIONS_DASHBOARD_SPEC.md`, `SYSTEM_MONITORING_GUIDE.md`

---

## Support readiness (documentation)

Ops documentation pack exists at `docs/certification/v1.3.8/production-operations/`:

| Document | Purpose |
|----------|---------|
| `PRODUCTION_OPERATIONS_MANUAL.md` | Day-2 operations |
| `INCIDENT_RESPONSE_PLAYBOOK.md` | Incident handling |
| `ROLLBACK_RUNBOOK.md` | Deploy rollback |
| `BACKUP_AND_RECOVERY_PLAN.md` | DR planning |
| `PRODUCTION_ALERT_MATRIX.md` | Alert definitions |
| Role guides (Admin, Collector, etc.) | End-user support |

**Documentation review:** Completed in Phase 21 — not re-audited here.

**Operator training / handover attendance:** **Pending**

---

## Deployment operations

| Item | Status |
|------|--------|
| API on Railway (`deployedAt` in health) | **PASS** — `2026-07-17T16:50:39.358Z` |
| Frontend on Vercel | **PASS** |
| Deploy workflow in repo | Documented |
| Post-deploy authenticated smoke | **Pending** |
| Rollback executed in last 90 days | **Pending** |

---

## Alerting & on-call

| Item | Status |
|------|--------|
| On-call roster defined | **Pending** |
| Escalation path documented | Documented (playbook) — activation **Pending** |
| Alert routes tested | **Pending** |

---

## Signoff block

| Role | Name | Date | Signature | Status |
|------|------|------|-----------|--------|
| Operations Owner | — | — | — | **Pending** |
| SRE / Platform | — | — | — | **Pending** |
| Support Lead | — | — | — | **Pending** |

---

## Verdict

**Production is operable** based on health, integrations, and public probes.

**Formal operations signoff: Pending** — complete [OPERATOR_CLOSURE_CHECKLIST.md](./OPERATOR_CLOSURE_CHECKLIST.md) §2–5 and attach named signatures in [FINAL_RELEASE_APPROVAL.md](./FINAL_RELEASE_APPROVAL.md).
