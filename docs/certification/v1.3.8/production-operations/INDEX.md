# WILMS v1.3.8 — Production Operations Pack

**Version:** 1.3.8  
**Last updated:** 2026-07-17  
**Audience:** SRE, DevOps, Super Admin, support leads

This pack is the authoritative operations documentation for WILMS production (Women's Interest-Free Loan Management System). It reflects the **real** v1.3.8 architecture: Next.js on Vercel, Express on Railway, Neon PostgreSQL, Cloudinary uploads, in-process workers (no Redis), and the new Super Admin Operations dashboard.

## Quick links

| Document | Purpose |
|----------|---------|
| [PRODUCTION_OPERATIONS_MANUAL.md](./PRODUCTION_OPERATIONS_MANUAL.md) | Master operations manual |
| [SYSTEM_MONITORING_GUIDE.md](./SYSTEM_MONITORING_GUIDE.md) | Logging, metrics, tracing |
| [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md) | Vercel + Railway + Neon deploy |
| [ROLLBACK_RUNBOOK.md](./ROLLBACK_RUNBOOK.md) | Frontend, API, database rollback |
| [BACKUP_AND_RECOVERY_PLAN.md](./BACKUP_AND_RECOVERY_PLAN.md) | Neon PITR, RTO/RPO, restore |
| [INCIDENT_RESPONSE_PLAYBOOK.md](./INCIDENT_RESPONSE_PLAYBOOK.md) | Incident playbooks |
| [PRODUCTION_ALERT_MATRIX.md](./PRODUCTION_ALERT_MATRIX.md) | Alert severity matrix |
| [OPERATIONS_DASHBOARD_SPEC.md](./OPERATIONS_DASHBOARD_SPEC.md) | `/ops` UI + API spec |
| [ENTERPRISE_OPERATIONS_GUIDE.md](./ENTERPRISE_OPERATIONS_GUIDE.md) | SRE/DevOps operating model |
| [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md) | Evidence-based go-live checklist |
| [PRODUCTION_SUPPORT_MANUAL.md](./PRODUCTION_SUPPORT_MANUAL.md) | Support tiers and escalation |
| [LONG_TERM_MAINTENANCE_PLAN.md](./LONG_TERM_MAINTENANCE_PLAN.md) | v1.4–v2.0 scaling roadmap |

## Role guides

| Role | Guide |
|------|-------|
| Super Admin | [ADMINISTRATOR_GUIDE.md](./ADMINISTRATOR_GUIDE.md) |
| Collector | [COLLECTOR_GUIDE.md](./COLLECTOR_GUIDE.md) |
| Registration Officer | [REGISTRATION_OFFICER_GUIDE.md](./REGISTRATION_OFFICER_GUIDE.md) |
| Approver | [APPROVER_GUIDE.md](./APPROVER_GUIDE.md) |
| Auditor | [AUDITOR_GUIDE.md](./AUDITOR_GUIDE.md) |

## Related documentation (repo root)

| Path | Notes |
|------|-------|
| [docs/deployment-guide.md](../../../deployment-guide.md) | Platform secrets and post-deploy checks |
| [docs/operations/monitoring.md](../../../operations/monitoring.md) | Health probes, CI gates (updated for v1.3.8) |
| [docs/operations/production-runbook.md](../../../operations/production-runbook.md) | Short deploy runbook (links here) |
| [docs/operations/backups.md](../../../operations/backups.md) | Backup summary (links here) |
| [docs/security-guide.md](../../../security-guide.md) | Auth, CSRF, rate limiting |
| [docs/permission-matrix.md](../../../permission-matrix.md) | RBAC source of truth |
| [docs/engineering/communication-platform.md](../../../engineering/communication-platform.md) | Mail/SMS/notification architecture |

## Production URLs

| Surface | URL |
|---------|-----|
| Frontend | https://wilms.vercel.app |
| API | https://wilms-production.up.railway.app |
| Health | `GET https://wilms-production.up.railway.app/health` |
| Ops status (auth) | `GET /api/v1/ops/status` via BFF |
| Ops metrics | `GET /api/v1/ops/metrics` |
| Super Admin UI | https://wilms.vercel.app/ops |

## Deploy workflow

Production deploy is gated by [`.github/workflows/deploy-production.yml`](../../../../.github/workflows/deploy-production.yml) (`workflow_dispatch`, input `confirm=deploy`).
