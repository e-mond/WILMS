# Production Support Manual — WILMS v1.3.8

**Version:** 1.3.8  
**Last updated:** 2026-07-17

## 1. Purpose

Defines support tiers, escalation paths, and role-specific guidance summaries for WILMS production.

## 2. Support tiers

| Tier | Name | Scope | Hours | Examples |
|------|------|-------|-------|----------|
| **L1** | Help desk / Super Admin delegate | Account access, how-to, password resets | Business hours | "Can't log in", "Where is export?" |
| **L2** | Application support / on-call engineer | Bugs, integration failures, deploy issues | On-call for P1/P2 | API errors, email not sent, RBAC issue |
| **L3** | Engineering + DBA | Data integrity, migrations, security incidents | Escalation | Corrupt balances, PITR restore, breach |

## 3. Contact and escalation

```
User → L1 (Super Admin / help desk)
         ↓ unresolved 30 min (P2) or immediate (P1)
       L2 (on-call engineer)
         ↓ data / security / migration
       L3 (engineering lead + DBA)
```

**Incident channel:** Use template in [INCIDENT_RESPONSE_PLAYBOOK.md](./INCIDENT_RESPONSE_PLAYBOOK.md).

## 4. Information to collect (all tiers)

| Field | Why |
|-------|-----|
| User email and role | RBAC context |
| Timestamp (UTC) | Log correlation |
| URL / workflow step | Reproduce |
| Screenshot or error message | UX issues |
| `X-Request-Id` (from browser devtools network tab) | API log search |
| Device / browser | PWA vs desktop |

## 5. Common requests by tier

### L1 — resolve without engineering

| Request | Action |
|---------|--------|
| Forgot password | Direct user to public reset flow; verify enumeration-safe message |
| Account locked | Super Admin → check failed login lockout settings; unlock user |
| New user | Super Admin → invite user; verify email delivery |
| Role change | Super Admin → Users; note session invalidation |
| Export help | Confirm role has `export-reports`; try alternate format |
| PWA update | Hard refresh or reinstall app after deploy |

### L2 — engineering involvement

| Request | Action |
|---------|--------|
| 5xx errors | Check `/health`, Railway logs by `requestId` |
| Email not received | [INCIDENT_RESPONSE_PLAYBOOK.md](./INCIDENT_RESPONSE_PLAYBOOK.md) § Email |
| SMS not received | § SMS |
| Permission denied (403) | Run `smoke:rbac`; verify permission matrix |
| Slow performance | Neon insights; check `0027` indexes applied |
| Post-deploy regression | [ROLLBACK_RUNBOOK.md](./ROLLBACK_RUNBOOK.md) |

### L3 — specialized

| Request | Action |
|---------|--------|
| Balance discrepancy | Financial incident playbook; no manual SQL |
| Bad migration | PITR procedure |
| Security breach | Rotate secrets; audit log review |
| Offline sync conflicts | Approver workflow; engineering if engine bug |

## 6. Role guide summary

Detailed guides in this pack:

| Role | Guide | Primary support topics |
|------|-------|------------------------|
| Super Admin | [ADMINISTRATOR_GUIDE.md](./ADMINISTRATOR_GUIDE.md) | Users, settings, ops, reconciliation |
| Collector | [COLLECTOR_GUIDE.md](./COLLECTOR_GUIDE.md) | Payments, PWA, offline, GPS |
| Registration Officer | [REGISTRATION_OFFICER_GUIDE.md](./REGISTRATION_OFFICER_GUIDE.md) | 7-step wizard, capture |
| Approver | [APPROVER_GUIDE.md](./APPROVER_GUIDE.md) | Loans, offline sync conflicts |
| Auditor | [AUDITOR_GUIDE.md](./AUDITOR_GUIDE.md) | Read-only reports, audit log |

## 7. Production constraints (support must know)

| Topic | Detail |
|-------|--------|
| Demo logins | `@wilms.demo` accounts **not** for production — real DB users only |
| Partial payments | Not supported — full weekly amount |
| Balance edits | Not supported — use adjustment workflow |
| Direct API from browser | Unsupported — use Vercel UI (CSRF) |
| Redis / queues | Not deployed — delayed notifications possible after API restart |

## 8. Self-service for Super Admin

| Tool | Path |
|------|------|
| Operations dashboard | `/ops` |
| Audit log | Reports → Audit Log |
| User management | Settings → Users |
| Communication center | Communications |
| Health (public) | `GET /health` on API URL |

## 9. SLA expectations (organizational targets)

Not measured by application unless contractually defined:

| Priority | Target response | Target resolution |
|----------|-----------------|-------------------|
| P1 | 15 min | 4 h |
| P2 | 30 min | 8 h |
| P3 | 4 h | 2 business days |
| P4 | 1 business day | Next release |

## 10. Knowledge base

| Doc | Use |
|-----|-----|
| [PRODUCTION_OPERATIONS_MANUAL.md](./PRODUCTION_OPERATIONS_MANUAL.md) | Ops overview |
| [docs/mobile-guide.md](../../../mobile-guide.md) | PWA, field ops |
| [docs/authentication.md](../../../authentication.md) | Auth flows |
| [docs/permission-matrix.md](../../../permission-matrix.md) | RBAC |
| [docs/financial-calculations.md](../../../financial-calculations.md) | Money rules |

## 11. Related docs

- [INCIDENT_RESPONSE_PLAYBOOK.md](./INCIDENT_RESPONSE_PLAYBOOK.md)
- [PRODUCTION_ALERT_MATRIX.md](./PRODUCTION_ALERT_MATRIX.md)
