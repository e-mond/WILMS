# Post-Deployment Monitoring Plan — WILMS v1.3.8

**Date:** 17 July 2026  
**Phase:** 23 — Production Cutover  
**Status:** Plan documented — **execution Pending** (metrics token and alert channels unset)

---

## Objectives

1. Detect production outages and degradation within defined SLO windows.
2. Correlate user-impacting errors via `X-Request-Id`.
3. Monitor financial and auth anomalies after cutover.
4. Provide evidence for operator-track closure in [PRODUCTION_ACCEPTANCE_CHECKLIST.md](./PRODUCTION_ACCEPTANCE_CHECKLIST.md).

---

## Production endpoints (baseline)

| Surface | URL | Current probe | Baseline latency |
|---------|-----|---------------|------------------|
| API health | `https://wilms-production.up.railway.app/health` | 200, `status: ok` | ~0.31s |
| API metrics | `…/ops/metrics` | 401 anon (expected) | ~0.11s |
| Frontend login | `https://wilms.vercel.app/login` | 200, `1.3.8` | ~0.20s |
| CSRF | `…/api/auth/csrf` | 200 | ~0.17s |

**Evidence:** `evidence/public-probes-20260717T193511Z.csv`

---

## Monitoring stack (target state)

| Layer | Tool / method | Status |
|-------|---------------|--------|
| Uptime | External probe → `GET /health` every 1–5 min | **Pending** |
| Metrics | Prometheus scrape → `/ops/metrics` with Bearer token | **Pending** |
| Logs | Railway structured logs; search by `x-request-id` | **Pending** (correlation not verified) |
| Frontend | Vercel analytics / deployment notifications | **Pending** |
| Alerts | Pager/email on health fail, 5xx rate, auth spike | **Pending** |

---

## Health check contract

Poll `GET /health` and alert on:

| Condition | Severity |
|-----------|----------|
| HTTP ≠ 200 | **Critical** |
| `status` ≠ `ok` | **Critical** |
| `database.status` ≠ `connected` | **Critical** |
| `schema.status` ≠ `ok` | **Critical** |
| `migrations.status` ≠ `ok` | **High** |
| `degradedReasons` non-empty | **High** |
| `version` ≠ expected release | **High** |

**Current production snapshot:** all green fields at probe time (`evidence/prod-health-20260717T193511Z.json`).

---

## Metrics scrape (Pending)

**Prerequisite:** `WILMS_METRICS_TOKEN` set on Railway (currently **UNSET** per credential audit).

```bash
curl -sS -H "Authorization: Bearer $WILMS_METRICS_TOKEN" \
  https://wilms-production.up.railway.app/ops/metrics
```

**Evidence to attach:** HTTP 200 + redacted Prometheus text snippet → `evidence/metrics-scrape-<timestamp>.txt`

**Prometheus target example:**

```yaml
scrape_configs:
  - job_name: wilms-api
    metrics_path: /ops/metrics
    scheme: https
    bearer_token: <WILMS_METRICS_TOKEN>
    static_configs:
      - targets: ['wilms-production.up.railway.app']
```

---

## Alert matrix (reference)

Full matrix: `docs/certification/v1.3.8/production-operations/PRODUCTION_ALERT_MATRIX.md`

| Alert | Trigger | Channel | Status |
|-------|---------|---------|--------|
| API down | Health probe fail 3× | Pager / email | **Pending** |
| DB disconnected | Health `database.status` | Pager | **Pending** |
| 5xx spike | Metrics threshold | Pager | **Pending** |
| Auth failure burst | Metrics / logs | Email | **Pending** |
| Deploy regression | `version` / `gitCommit` drift | Email | **Pending** |
| Scheduler missed | No heartbeat if cron monitored | Email | **Pending** |

**Alert delivery test:** fire synthetic alert and attach delivery log → **Pending**.

---

## Post-cutover watch window (first 72 hours)

| Window | Focus | Owner |
|--------|-------|-------|
| 0–4 h | Health, login, CSRF, error rate | SRE on-call |
| 4–24 h | Collection workflows, mail/SMS delivery | Ops + Support |
| 24–72 h | Reconciliation reports, migration stability | Finance + DBA |

**Note:** Authenticated workflow monitoring requires smoke credentials — currently **Pending**.

---

## Log correlation procedure

1. Capture `x-request-id` from API response (e.g. `c3e974d2-e573-42f7-939f-d27274b7fa90` from Phase 23 probe).
2. Search Railway logs for that ID.
3. Attach matching log line → `evidence/request-id-correlation-<timestamp>.txt`

**Status:** **Pending** — not executed in Phase 23.

---

## Review cadence

| Cadence | Activity |
|---------|----------|
| Daily (first week) | Health JSON review, error log scan |
| Weekly | Metrics dashboard review, alert noise tuning |
| Monthly | Restore drill spot-check, integration delivery test |
| Per release | Update expected `version` / `gitCommit` in probes |

---

## Closure criteria (monitoring track)

| Item | Status |
|------|--------|
| External uptime probe active | **Pending** |
| Metrics scrape 200 with token | **Pending** |
| Alert delivery test logged | **Pending** |
| Request ID log correlation demonstrated | **Pending** |
| Operations sign-off | **Pending** |

Until closure, monitoring plan is **documented only** — cutover remains **⚠ READY WITH CONDITIONS**.
