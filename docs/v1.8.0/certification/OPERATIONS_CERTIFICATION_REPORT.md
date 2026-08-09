# WILMS v1.8.0 — Operations Certification Report

**Generated (UTC):** 2026-08-09T19:30:30Z

## Verdict

**PARTIAL**

## Evidenced from production health

| Topic | Observation |
|-------|-------------|
| Health | `status: ok` |
| Workers | `redis: not_used`, `queue: in_process`, `scheduler: http_triggered` |
| Uploads / mail / SMS | configured |
| Migrations | ok |

## BLOCKED / PENDING

| Topic | Why |
|-------|-----|
| Cron last-run metrics | No authenticated ops dashboard capture |
| Scheduler HTTP invoke with token | `WILMS_SCHEDULER_TOKEN` not available to agent |
| Incident / maintenance window UI | No interactive session |
| Queue retry behaviour under failure | Not injected |
| Logging / monitoring vendor dashboards | Out of band |

## Close criteria

Ops dashboard screenshots; cron invocation 200 with request id; last-run timestamps; incident create/resolve drill (`scripts/operator/run-incident-drill-gate.sh` if used).
