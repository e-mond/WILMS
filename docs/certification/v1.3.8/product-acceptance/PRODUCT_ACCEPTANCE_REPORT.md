# Product Acceptance Report — WILMS v1.3.8

**Classification:** Product Acceptance (Phase 21)  
**Version:** 1.3.8  
**Code line:** `main` (Phase 20 merged via PR #126)  
**Date:** 17 July 2026  
**Sign-off posture:** CTO / QA Director / Compliance

---

## 1. Acceptance objective

Confirm that WILMS v1.3.8 is **operationally acceptable** for a women's interest-free loan programme: staff can execute the full money chain, roles are enforced, financial KPIs are server-derived, documentation supports go-live, and residual risks are explicit — without claiming capabilities outside product boundary (no borrower portal, no statutory GL).

This report **does not** re-run Phase 17–20 audits. It synthesizes product-facing evidence and states launch conditions.

---

## 2. Product scope accepted

| Dimension | Evidence | Status |
|-----------|----------|--------|
| Staff roles (5) | `packages/shared-rbac/src/roles.ts`, `apps/backend/src/seed/demo-users.ts` | ✅ Accepted |
| No borrower login | No borrower portal routes in `apps/frontend/src/app/`; borrowers are records managed by staff | ✅ Boundary confirmed |
| 32 navigation targets | `apps/frontend/src/constants/navigation.ts` → 57 `page.tsx` routes under `apps/frontend/src/app/` | ✅ No dead ends |
| Money chain | Backend modules under `apps/backend/src/modules/{borrowers,loans,loan-pools,groups,payments,expenses,reconciliation,reports,audit,collector-portal,dashboard,ops}` | ✅ End-to-end |
| Dashboard SoT | `buildDashboardFinancialOverview()` in `apps/backend/src/modules/dashboard/financial-overview.ts`; frontend `dashboardService.ts` → `GET /dashboard/summary` only | ✅ Server authority |
| RBAC SSoT | `packages/shared-rbac`; `docs/permission-matrix.md` aligned | ✅ Accepted |
| Ops surface | `/ops` → `apps/frontend/src/app/(super-admin)/ops/page.tsx`; API `apps/backend/src/modules/ops/` | ✅ Accepted |
| Technical debt markers | 0 `TODO`/`FIXME`/`HACK` in `apps/` + `packages/` source (ripgrep, July 2026) | ✅ Clean |
| Production mock guard | `apps/backend/src/config/mock-guard.ts`, `apps/frontend/next.config.mjs` `shouldUseMockServices()` | ✅ Enforced |

---

## 3. Test evidence (acceptance gate)

| Suite | Command | Result (this phase) |
|-------|---------|---------------------|
| Backend unit/integration | `npm run test -w @wilms/api` | **150 tests passed** (43 files) |
| Frontend unit | `npm run test` | Vitest suite in `apps/frontend/src/tests/` (160+ files) |
| RBAC smoke | `npm run smoke:rbac` | Script in root `package.json` → `@wilms/api` |
| Migration verify | `npm run verify:migrations` | Journal integrity via `apps/backend/src/verification/verify-migration-journal.ts` |

**Residual:** Staging authenticated end-to-end smoke with archived evidence is a **launch condition**, not yet filed in this pack.

---

## 4. Documentation acceptance (Phase 21 branch)

| Item | Path | Status |
|------|------|--------|
| Docs hub | `docs/README.md` | ✅ v1.3.8 stamp, links to all packs |
| README release history | `README.md` § release table | ✅ v1.3.8 entry |
| Agent path fix | `docs/AGENTS.md` → `context/architecture/adr` | ✅ Corrected |
| Security guide stamp | `docs/security-guide.md` | ✅ 2026-07-17 (v1.3.8) |
| Production guide stamp | `docs/production-guide.md` | ✅ 2026-07-17 (v1.3.8) |
| CHANGELOG ops note | `CHANGELOG.md` § 1.3.8 Added | ✅ `/ops`, metrics, acceptance pack |
| Financial SoT doc | `docs/financial-calculations.md` | ✅ Aligns with dashboard builder |
| Production ops pack | `docs/certification/v1.3.8/production-operations/` | ✅ Handover source |

---

## 5. Residual conditions (non-blocking for dev/staging ops)

These do **not** invalidate v1.3.8 code quality; they block **unconditional** production certification:

1. **Migration 0027** — `0027_hot_query_indexes.sql` in journal idx 27 (`apps/backend/src/db/migrations/meta/_journal.json`); must be applied on all environments before promote.
2. **Staging E2E smoke** — Authenticated workflow evidence (registration → disburse → collect → reconcile → report) with screenshots/logs.
3. **Neon PITR / restore test** — Documented restore drill per `docs/certification/v1.3.8/production-operations/BACKUP_AND_RECOVERY_PLAN.md`.
4. **In-process queues** — Accepted for v1.3.8 (`ops/service.ts` reports `queue: 'in_process'`); Redis/BullMQ deferred to v1.4.
5. **No statutory GL** — Operational ledger only; roadmap in `docs/certification/v1.3.8/enterprise-architecture/DOUBLE_ENTRY_LEDGER_MIGRATION_ROADMAP.md`.
6. **No 100k+ load proof** — Scale acceptance deferred.
7. **WCAG** — Full audit not re-run this phase; component-level tests exist (`CurrencyAmount`, forms).
8. **Feature flags** — Not productized; env-based config only.

---

## 6. Recommendation

### ⚠ Ready with Conditions

WILMS v1.3.8 is **accepted for operational pilot and staging go-live** once migration 0027 is applied and staging smoke + backup evidence are filed.

### What would be required for ✅ Ready for Production (unconditional)

| # | Requirement |
|---|-------------|
| 1 | All 28 journal migrations applied; `/health` reports `migrations.status: ok` and `schema.status: ok` |
| 2 | Staging smoke pack: five roles, full money chain, signed QA log |
| 3 | Neon PITR restore test completed within 90 days with RTO/RPO notes |
| 4 | Production config verified: mock flags off, Cloudinary/SMS/mail configured per `production-guide.md` |
| 5 | On-call runbook acknowledged: `INCIDENT_RESPONSE_PLAYBOOK.md`, `ROLLBACK_RUNBOOK.md` |
| 6 | Executive sign-off on accepted limitations (in-process queues, no GL, no borrower portal) |

---

## 7. Evidence index

| Topic | Primary path |
|-------|--------------|
| Navigation | `apps/frontend/src/constants/navigation.ts` |
| RBAC | `packages/shared-rbac/src/role-permissions.ts` |
| API enforcement | `apps/backend/src/middleware/require-permission.ts` |
| UI gates | `apps/frontend/src/components/auth/PermissionGate.tsx` |
| Financial overview | `apps/backend/src/modules/dashboard/financial-overview.ts` |
| Ops status | `apps/backend/src/modules/ops/service.ts` |
| Migrations | `apps/backend/src/db/migrations/meta/_journal.json` |
| Scorecard | [LAUNCH_READINESS_SCORECARD.md](./LAUNCH_READINESS_SCORECARD.md) |

**Prepared by:** Product Acceptance Working Group (Phase 21)  
**Next review:** Upon closure of launch conditions or v1.4 queue migration.
