# System Architecture (SSoT)

**WILMS — Women's Interest-Free Loan Management System**  
**Version context:** 1.3.8+  
**Date:** 17 July 2026  
**Status:** Living document — prefer this over scattered FINAL_* root reports for current architecture.

---

## 1. System context

```text
┌─────────────┐     HTTPS      ┌──────────────────┐
│ Collectors  │───────────────▶│ Vercel (Next.js)  │
│ Officers    │                │ BFF /api/wilms/*  │
│ Approvers   │                │ CSRF + session    │
│ Auditors    │                └────────┬─────────┘
│ Super Admin │                         │ proxy
└─────────────┘                         ▼
                               ┌──────────────────┐
                               │ Railway Express  │
                               │ @wilms/api       │
                               └────────┬─────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              ┌──────────┐       ┌──────────┐       ┌────────────┐
              │ Neon PG  │       │Cloudinary│       │ Mail / SMS │
              └──────────┘       └──────────┘       └────────────┘
```

---

## 2. Runtime topology

| Component | Host | Role |
|---|---|---|
| `@wilms/frontend` | Vercel | UI, BFF proxy, PWA shell |
| `@wilms/api` | Railway | Domain API, auth, financial writes |
| PostgreSQL | Neon | System of record |
| Uploads | Cloudinary (prod) | Documents / receipts |
| Mail | Gmail via relay (configured) | Invitations, notices |
| SMS | Provider adapter | Optional field notices |
| Jobs | **In-process today** | Notifications, scheduler |

Without `DATABASE_URL`, API uses in-memory store (local/demo only).

---

## 3. Modular monolith (bounded contexts)

| Context | Modules (approx.) | Owns |
|---|---|---|
| Identity & Access | `auth`, `settings` (users/roles), permissions | Sessions, RBAC, invites |
| Onboarding | `borrowers`, documents, GPS | Registration lifecycle |
| Lending | `loans`, schedules, disbursements | Loan lifecycle, interest-free rules |
| Collections | `payments`, reversals, collector-portal | Field repayments |
| Treasury | `loan-pools` | Capital, utilisation |
| Operating cash | `expenses` | OpEx (not principal) |
| Cash control | `reconciliation` | Collector EOD |
| Adjustments | `adjustments` | Supervised corrections |
| Communications | `communications`, notifications, messages | Outbound channels |
| Reporting | `dashboard`, reports/exports | KPIs (must become SQL-derived) |
| Sync | `sync` | Offline batch |

Shared packages: `@wilms/shared-rbac`, `shared-types`, `shared-contracts`, `shared-utils`, `shared-validation`.

---

## 4. AuthN / AuthZ

- **AuthN:** HMAC-signed opaque session (cookie + Bearer), server-validated `sessionVersion`
- **AuthZ:** Role permissions ∪ grants \ revokes; resource scoping for collectors/officers
- **CSRF:** Enforced on BFF mutating routes
- **SoD:** Documented in `enterprise-financial/SOD_AUDIT.md`

Not JWT. Not a full ABAC engine (yet).

---

## 5. Financial data flow (operational)

```text
Pool funding → Loan create (PENDING_APPROVAL) → Approve → Admin fee gate
  → Disburse (pool capital check) → ACTIVE
  → Collections (GPS, payment day / holiday shift)
  → Reversal (compensating ledger + pool allocation)
  → Expenses (operating cash only)
  → Reconciliation (collector cash vs system)
  → Dashboard / reports (must match ledger sources)
```

See `docs/financial-calculations.md` and `enterprise-financial/LEDGER_INTEGRITY_REPORT.md`.

**Statutory GL:** not yet present — roadmap in `DOUBLE_ENTRY_LEDGER_MIGRATION_ROADMAP.md`.

---

## 6. Sequence — record payment (happy path)

```text
Collector UI → BFF (CSRF) → POST /payments + Idempotency-Key
  → requirePermission(RECORD_COLLECTIONS)
  → assertBorrowerReadAccess (collector)
  → validate schedule / payment day
  → BEGIN
       insert payment CONFIRMED
       mark schedule week PAID
       update loan_balance
       append ledger REPAYMENT
       append pool REPAYMENT allocation
       refresh pool aggregates
  → COMMIT
  → notify (async best-effort)
```

---

## 7. Deployment

| Env | Trigger |
|---|---|
| CI | PR/push — typecheck, lint, tests, build |
| Staging | Optional after main green |
| Production | Manual `workflow_dispatch` with confirm |

Health: `GET /health` — DB, migrations watermark, uploads, integrations. See health service.

---

## 8. Key diagrams (ER — core money)

```text
users ─┬─ borrowers ── loans ── loan_schedules
       │                │
       │                ├── ledger_entries
       │                ├── payments
       │                └── disbursements
       │
       ├─ collectors (profile)
       ├─ groups ── group_members
       ├─ loan_pools ── pool_allocations
       ├─ expenses
       ├─ financial_reconciliations ── reconciliation_history
       └─ audit_entries
```

---

## 9. Permission matrix (summary)

| Role | Portal | Money write | Approve loan | Review recon | Manage users |
|---|---|---|---|---|---|
| Collector | Collector | Collections / own expenses | No | No | No |
| Registration Officer | Registration | No | No | No | No |
| Approver | Approver | No | Yes | No | No |
| Auditor | Auditor | No | No | No | No |
| Super Admin | Admin | Yes (audited) | Yes | Yes | Yes |

Full matrix: `@wilms/shared-rbac` + `enterprise-financial/RBAC_VERIFICATION.md`.

---

## 10. Related docs

| Topic | Doc |
|---|---|
| Security | `docs/security-guide.md` |
| Deploy | `docs/deployment-guide.md` |
| Offline | `docs/offline-architecture.md` |
| Ops | `docs/operations/*` |
| ADRs | `docs/adr/*` |
| Phase 17 recommendations | `ENTERPRISE_ARCHITECTURE_RECOMMENDATIONS.md` |
