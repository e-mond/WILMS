# WILMS Architecture — v1.4.1

**Date:** 2026-07-20  
**Audit index:** [FINAL_AUDIT_INDEX.md](./FINAL_AUDIT_INDEX.md)  
**Deeper enterprise diagram pack:** [`certification/v1.3.8/enterprise-architecture/`](./certification/v1.3.8/enterprise-architecture/)

---

## System shape

```text
Browser (staff portals)
  → Next.js 14 frontend (:3000)
       → BFF /api/wilms/[...path]  (CSRF, proxy)
            → Express API (:4000)  @wilms/api
                 → Drizzle / PostgreSQL   (or in-memory if DATABASE_URL unset)
                 → optional Redis / BullMQ queues
```

Monorepo: npm workspaces + Turborepo — `apps/frontend`, `apps/backend`, `packages/shared-*`.

---

## Trust boundaries

| Boundary | Rule |
|----------|------|
| RBAC | Server enforces permissions from `packages/shared-rbac`; UI hides is not security |
| Sessions | Authenticated middleware + `assertSessionActive` (revoke/suspend) |
| Demo accounts | Production runtime rejects `@wilms.demo` login; seed gated off |
| Money | Server-authoritative; balances derived from transactions — see [FINANCIAL_MODEL.md](./FINANCIAL_MODEL.md) |
| BFF | Prefer browser UI through BFF; CSRF enforced |

---

## Major modules (API)

Auth, borrowers, payments, loans / pools, reports, dashboard, reconciliation, expenses, communications, uploads, health/ops, settings/roles.

---

## Environments

| Mode | Database | Demo seed | Use |
|------|----------|-----------|-----|
| Local / CI without DB | In-memory | Allowed | Dev/test |
| Staging / Production | Postgres | Blocked | Real operations |

Node **22** required (`engines`). Staging deploy gated by `ENABLE_STAGING_DEPLOY`.

---

## Related docs

- Permissions: [PERMISSIONS_AND_ROLES.md](./PERMISSIONS_AND_ROLES.md)  
- Frontend architecture folder: [`architecture/`](./architecture/)  
- Phase 25 platform (queues, idempotency, flags): [`certification/v1.4/phase-25/`](./certification/v1.4/phase-25/)  
- Final system audit: [`certification/v1.4/final-system-audit/FINAL_FULL_SYSTEM_AUDIT.md`](./certification/v1.4/final-system-audit/FINAL_FULL_SYSTEM_AUDIT.md)
