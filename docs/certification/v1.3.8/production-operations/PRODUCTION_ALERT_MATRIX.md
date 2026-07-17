# Production Alert Matrix — WILMS v1.3.8

**Version:** 1.3.8  
**Last updated:** 2026-07-17

Alerts below are **recommended configurations** for external monitoring (UptimeRobot, Better Stack, Prometheus Alertmanager, Railway/Vercel native). WILMS does not ship an in-app alert bus in v1.3.8.

## Severity legend

| Severity | Response | Notification |
|----------|----------|--------------|
| **Critical** | Immediate; wake on-call | Pager + incident channel |
| **High** | &lt; 30 min | On-call + Slack |
| **Medium** | &lt; 4 h | Slack / email |
| **Low** | Next business day | Email digest |

---

## Infrastructure alerts

| ID | Alert | Condition | Severity | Source | Runbook |
|----|-------|-----------|----------|--------|---------|
| INF-01 | API down | `GET /health` ≠ 200 for 2 min | **Critical** | Uptime probe | [INCIDENT_RESPONSE_PLAYBOOK.md](./INCIDENT_RESPONSE_PLAYBOOK.md) § API |
| INF-02 | Health degraded | `status == "degraded"` for 5 min | **High** | `/health` JSON | Check `degradedReasons` |
| INF-03 | Database disconnected | `wilms_database_up == 0` or `database.connected == false` | **Critical** | Metrics / health | § Database |
| INF-04 | Migrations behind | `migrations.status != "ok"` | **High** | `/health` | Run `db:migrate` |
| INF-05 | Schema missing tables | `schema.missingTables` non-empty | **Critical** | `/health` | Migrate + schema repair |
| INF-06 | API uptime reset | `wilms_uptime_seconds` drops sharply (restart) | **Low** | Prometheus | Correlate with deploy |
| INF-07 | Railway CPU sustained high | &gt; 85% 15 min | **Medium** | Railway metrics | Scale compute |
| INF-08 | Railway memory high | &gt; 90% 10 min | **High** | Railway metrics | Restart / scale |
| INF-09 | Frontend down | Login page ≠ 200 for 2 min | **Critical** | Uptime probe | Vercel status / rollback |
| INF-10 | BFF CSRF unavailable | `/api/auth/csrf` ≠ 200 | **High** | Uptime probe | Vercel functions |

---

## Integration alerts

| ID | Alert | Condition | Severity | Source | Runbook |
|----|-------|-----------|----------|--------|---------|
| INT-01 | Mail not configured | `wilms_mail_configured == 0` in production | **High** | `/ops/metrics` | § Email |
| INT-02 | SMS not configured | `wilms_sms_configured == 0` in production | **High** | `/ops/metrics` | § SMS |
| INT-03 | Uploads invalid | `uploads.valid == false` | **Critical** | `/health` | Cloudinary secrets |
| INT-04 | Mail send failures | Log pattern `[mail] * failed` &gt; 5 in 15 min | **High** | Railway logs | Gmail relay / Resend |
| INT-05 | SMS provider errors | Provider 4xx/5xx in logs | **Medium** | Railway logs | Provider dashboard |

---

## Security alerts

| ID | Alert | Condition | Severity | Source | Runbook |
|----|-------|-----------|----------|--------|---------|
| SEC-01 | Login rate limit surge | `RATE_LIMITED` &gt; 50 in 15 min | **Medium** | API logs | Possible brute force |
| SEC-02 | Unhandled API errors spike | `[api] unhandled error` &gt; 10 in 5 min | **High** | API logs | § API |
| SEC-03 | Metrics endpoint abuse | 401/403 spike on `/ops/metrics` | **Medium** | API logs | Rotate `WILMS_METRICS_TOKEN` |
| SEC-04 | Audit suspicious activity | Manual review trigger | **High** | Super Admin audit log | § Security |
| SEC-05 | Version/deploy drift | `verify:version` fails post-deploy | **High** | CI / cron | Redeploy |

---

## Financial alerts

| ID | Alert | Condition | Severity | Source | Runbook |
|----|-------|-----------|----------|--------|---------|
| FIN-01 | Negative operating cash | `wilms_negative_operating_cash == 1` | **Medium** | `/ops/metrics` | Review pools/expenses |
| FIN-02 | Financial snapshot unavailable | `financial_snapshot_unavailable` in ops status | **High** | `/ops/status` | DB query health |
| FIN-03 | Health OK but collections anomaly | Manual: collection rate drop &gt; 20% WoW | **Medium** | Reports | Business review |
| FIN-04 | Overpayment review queue growth | Manual threshold | **Medium** | Approver queue | § Financial |

---

## Deploy / release alerts

| ID | Alert | Condition | Severity | Source | Runbook |
|----|-------|-----------|----------|--------|---------|
| DEP-01 | Deploy workflow failed | GitHub Actions failure | **High** | GitHub | § Deploy |
| DEP-02 | Smoke tests failed | `smoke:production` fail in workflow | **Critical** | GitHub | Rollback |
| DEP-03 | RBAC smoke failed | `smoke:rbac` fail | **High** | GitHub | Permission regression |
| DEP-04 | Git commit mismatch | `verify:deploy-sync` fail | **High** | GitHub | Redeploy API |
| DEP-05 | Bundle budget exceeded | CI `bundle:budget-check` fail | **Low** | CI | Block release |

---

## Application / UX alerts

| ID | Alert | Condition | Severity | Source | Runbook |
|----|-------|-----------|----------|--------|---------|
| APP-01 | Photo capture 401 | Public capture returns 401 | **High** | Synthetic curl | BFF route auth regression |
| APP-02 | Ops dashboard degraded | Super Admin `/ops` critical surface degraded | **Medium** | Manual / synthetic | `/ops/status` |
| APP-03 | PWA service worker errors | Elevated SW errors in Vercel | **Low** | Vercel analytics | Cache version bump |

---

## Alert routing example (Prometheus Alertmanager)

```yaml
groups:
  - name: wilms-critical
    rules:
      - alert: WilmsHealthDown
        expr: wilms_health_up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: WILMS API health degraded
      - alert: WilmsDatabaseDown
        expr: wilms_database_up == 0
        for: 1m
        labels:
          severity: critical
```

## Implementation checklist

- [ ] External uptime on `/health` and `/login`
- [ ] Prometheus scrape of `/api/v1/ops/metrics` with `WILMS_METRICS_TOKEN`
- [ ] Railway log alerts for `[api] unhandled error`
- [ ] GitHub Actions failure notifications
- [ ] Quarterly review of thresholds

## Related docs

- [SYSTEM_MONITORING_GUIDE.md](./SYSTEM_MONITORING_GUIDE.md)
- [INCIDENT_RESPONSE_PLAYBOOK.md](./INCIDENT_RESPONSE_PLAYBOOK.md)
