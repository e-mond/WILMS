# System Handover Guide — WILMS v1.3.8

**Phase:** 21 — Product Acceptance  
**Audience:** Operations, Support, Super Admin  
**Date:** 17 July 2026

---

## 1. What you are receiving

WILMS v1.3.8 is a **staff-operated** loan management system:

- **5 roles** with separate portals (no borrower login)
- **Money chain:** registration through audit (see §3)
- **Hosting:** Vercel (frontend) + Railway (API) + Neon (Postgres) per `docs/production-guide.md`
- **Ops dashboard:** `/ops` (Super Admin) — health, financial snapshot, worker topology

---

## 2. Operational flow (staff)

```mermaid
flowchart LR
  subgraph Registration
    RO[Registration Officer]
    RO -->|register borrower| B[Borrower record PENDING]
  end

  subgraph Approval
    AP[Approver]
    B --> AP
    AP -->|approve| BA[Borrower APPROVED]
    AP -->|approve loan| LA[Loan approved]
  end

  subgraph Admin
    SA[Super Admin]
    BA --> SA
    SA -->|groups / pools| GP[Group + Pool funded]
    GP --> LC[Loan created]
    LC --> AF[Admin fee recorded]
    AF --> LA
    LA -->|disburse| DIS[Loan DISBURSED]
  end

  subgraph Field
    CO[Collector]
    DIS --> CO
    CO -->|weekly payment| PAY[Payment posted]
    CO -->|expenses| EXP[Expense recorded]
    CO -->|end of day| REC[Reconciliation submitted]
  end

  subgraph Control
    REC --> SA
    SA -->|approve/reject recon| CLOSED[Period closed]
    AU[Auditor] -->|read-only| RPT[Reports + Audit log]
    CLOSED --> RPT
  end
```

---

## 3. Financial flow (system of record)

```mermaid
flowchart TB
  subgraph Capital
    POOL[Loan Pool capital_pesewas]
    POOL -->|REPLENISHMENT| ALLOC[pool_allocations ledger]
  end

  subgraph Lending
    ALLOC -->|DISBURSEMENT| OUT[Outstanding balance]
    LOAN[loans table] --> OUT
  end

  subgraph Collections
    PAY[payments confirmed] -->|REPAYMENT| ALLOC
    PAY --> DASH[buildDashboardFinancialOverview]
  end

  subgraph Costs
    EXP[expenses] --> ES[getExpenseSummary]
    ES --> DASH
  end

  subgraph Reporting
    DASH --> API[GET /dashboard/summary]
    DASH --> OPS[GET /ops/status financial block]
    API --> UI[Super Admin Dashboard]
    OPS --> OPU[Ops page /ops]
    RPT[reports modules] --> DASH
  end

  subgraph Audit
    MUT[Sensitive mutations] --> LOG[audit log immutable]
  end
```

**SSoT:** `apps/backend/src/modules/dashboard/financial-overview.ts` — documented in `docs/financial-calculations.md`.

---

## 4. Deploy architecture

```mermaid
flowchart TB
  subgraph Users
    BROWSER[Staff browser / Collector PWA]
  end

  subgraph Vercel
    NEXT[Next.js 14 frontend :3000]
    BFF["/api/wilms/[...path] BFF proxy"]
    NEXT --> BFF
  end

  subgraph Railway
    API[Express API :4000]
    WORK[in-process workers mail/SMS/scheduler]
    API --> WORK
  end

  subgraph Data
    NEON[(Neon PostgreSQL)]
    CLD[Cloudinary uploads]
  end

  subgraph External
    SMS[SMSNotifyGH]
    MAIL[Resend / SMTP]
  end

  BROWSER -->|HTTPS| NEXT
  BFF -->|CSRF + session cookies| API
  API --> NEON
  API --> CLD
  API --> SMS
  API --> MAIL

  SA_OPS[Super Admin /ops] --> BFF
  BFF -->|GET /ops/status /ops/metrics| API
```

**Correlation:** `X-Request-Id` from BFF through API (`CHANGELOG.md`, `request-id.test.ts`).

---

## 5. Environment configuration

### 5.1 Production (required)

| Check | Reference |
|-------|-----------|
| Mock flags **off** | `mock-guard.ts` — process exits if `NEXT_PUBLIC_USE_MOCK=true` |
| `DATABASE_URL` set | Neon connection |
| Migrations applied | `npm run verify:migrations`; health `migrations.status: ok` |
| Uploads | Cloudinary env per backend config |
| Frontend API mode | `NEXT_PUBLIC_USE_MOCK=false`, `WILMS_API_UPSTREAM` |

See `docs/production-guide.md` and `production-operations/DEPLOYMENT_RUNBOOK.md`.

### 5.2 Local dev against API

From root `AGENTS.md`:

```bash
# apps/frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=/api/wilms
NEXT_PUBLIC_USE_MOCK=false
WILMS_API_UPSTREAM=http://127.0.0.1:4000
```

```bash
npm run dev:api   # :4000
npm run dev       # :3000
```

Demo logins: `apps/backend/src/seed/demo-users.ts` (in-memory when `DATABASE_URL` unset).

---

## 6. Health and monitoring

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | DB, schema, migrations, integrations |
| `GET /ops/status` | Super Admin aggregated status |
| `GET /ops/metrics` | Prometheus text format |

UI: `https://wilms.vercel.app` → login as Super Admin → **Operations** (`/ops`).

Guides: `production-operations/SYSTEM_MONITORING_GUIDE.md`, `PRODUCTION_ALERT_MATRIX.md`.

---

## 7. Support runbooks (handover checklist)

| # | Document | Use when |
|---|----------|----------|
| 1 | `GO_LIVE_CHECKLIST.md` | Pre-promote |
| 2 | `DEPLOYMENT_RUNBOOK.md` | Deploy / migrate |
| 3 | `ROLLBACK_RUNBOOK.md` | Bad deploy |
| 4 | `INCIDENT_RESPONSE_PLAYBOOK.md` | Outage / degradation |
| 5 | `BACKUP_AND_RECOVERY_PLAN.md` | Data recovery |
| 6 | `PRODUCTION_SUPPORT_MANUAL.md` | L1/L2 tickets |
| 7 | Role guides (5) | Staff training |

---

## 8. Known operational constraints (v1.3.8)

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| In-process queue | API restart drops in-flight background jobs | Re-send from Communication Center; v1.4 queues |
| Single-instance workers | No horizontal worker scaling | Keep one Railway API instance until Redis |
| No borrower portal | Borrowers call office / collector | By design |
| No statutory GL | Export reports for external accounting | Roadmap v1.4+ |
| Migration 0027 | Hot query indexes | Apply before prod promote |

---

## 9. Verification commands (post-handover)

```bash
npm run verify:migrations
npm run verify:deploy-sync
npm run smoke:production
npm run smoke:rbac
npm run type-check
npm run test -w @wilms/api
```

---

## 10. Escalation

| Tier | Contact / action |
|------|------------------|
| L1 | `PRODUCTION_SUPPORT_MANUAL.md` — password reset, collector assignment |
| L2 | `INCIDENT_RESPONSE_PLAYBOOK.md` — DB, mail, SMS |
| L3 | Engineering — schema repair only with written recovery plan |

---

## 11. Handover sign-off items

- [ ] Super Admin can reach `/ops` and read green/degraded surfaces
- [ ] `/health` returns `schema.status: ok` on target environment
- [ ] Migration 0027 applied (journal idx 27)
- [ ] Role guides distributed to programme staff
- [ ] On-call has runbook URLs bookmarked
- [ ] Staging smoke evidence filed (launch condition)

**Handover status:** ⚠ **Conditional** — complete checklist above for unconditional ops acceptance.
