# WILMS — Stage 4 API & Database Review

**Audit stage:** 4 (API & Database Review)  
**Date:** 2026-07-10  
**Repository:** `e-mond/WILMS`  
**Git ref audited:** `main` @ `3762944` (post PR #79 RBAC + Stage 2/3 remediation)  
**Method:** Static review of Express route modules, Drizzle schema/migrations, persistence layer, and BFF proxy; execution of `verify:api-integrity`, `verify:api-coverage`, and backend Vitest; unauthenticated production `/health` probe. **No code changes were made as part of this stage.**

**Scope note:** Database query plans (EXPLAIN), migration apply on staging, and authenticated API contract tests require `DATABASE_URL` / live credentials not available in the cloud agent workspace. Production probes hit **deployed API v1.2.1** with **17** applied migrations; repo `main` is **v1.3.1** with **21** migration files.

---

## Executive summary

The API surface is large and internally consistent: **202** Express route handlers across **28** modules, **165** frontend `apiClient` calls, and **zero** static integrity mismatches. CI gates `verify:api-integrity` and `verify:api-coverage` both **PASS** (54 Next.js pages, 0 placeholder UI strings). Financial write paths (loans, payments, adjustments, reconciliation, offline sync) use `runInTransaction` and idempotency wrappers where appropriate.

The main risks are **operational and scalability**, not contract breakage:

1. **Production schema drift** — deployed API reports **17/17** migrations (latest tag `0016_v120_communication_platform`); repo expects **21** (through `0020_v130_field_operations`). Four migrations including OTP challenges, user lifecycle, platform stabilization, and field operations are not applied in production.
2. **Unbounded list reads** — core list endpoints (`borrowers`, `payments`, `groups`) load full tables into memory with no server-side pagination.
3. **Index gaps** — high-traffic foreign keys (`payments.borrower_id`, `group_members`, `borrowers` soft-delete filter) have constraints but no supporting btree indexes in migrations.
4. **Dual persistence** — `persistence.ts` and several services branch on `isDatabaseEnabled()` between in-memory stores and PostgreSQL; production uses DB, but the pattern increases the chance of behavioral drift between demo and live modes.

---

## 1. API surface inventory

### 1.1 Mount topology

`apps/backend/src/http/app.ts` registers:

| Layer | Routes | Auth |
|-------|--------|------|
| Global middleware | `helmet`, `cors`, `express.json` (15mb), `cookieParser`, `optionalAuth` | Session parsed when present |
| Public / special | `health`, `tracking`, `webhooks`, `auth` | Mixed (auth routes issue sessions) |
| Business (×2) | 26 routers mounted at **`/api/v1`** and **root** (`''`) | Per-router `requireAuth` / `requirePermission` |

Dual mount preserves backward compatibility for direct Railway clients and the Next.js BFF proxy (which forwards to upstream **without** `/api/v1` prefix — see §1.4).

### 1.2 Module route counts (static grep of `routes.ts`)

| Module | Handlers (approx.) | Primary domain |
|--------|-------------------|----------------|
| borrowers | 25 | Registration, validation, drafts |
| settings | 25 | Users, roles, integrations |
| communications | 17 | Templates, messages, delivery |
| loans | 13 | Disbursement, schedules |
| groups | 12 | Group CRUD, formation |
| reports | 9 | Ledger, portfolio, daily collection |
| reconciliation | 5 | Collector reconciliation |
| payments | 6 | Recording, reversal |
| adjustments | 6 | Financial adjustments workflow |
| risk-flags | 6 | Risk management |
| organization-holidays | 4 | Holiday calendar (v1.3.0) |
| sync | 4 | Offline queue replay |
| … | … | collectors, dashboard, expenses, etc. |

**Total:** 202 route declarations across 28 `routes.ts` files.

### 1.3 Public vs authenticated surface

| Path prefix | Authentication | Stage 1 cross-ref |
|-------------|----------------|-------------------|
| `/health` | None | Safe metadata only |
| `/auth/*` | Mixed (login public; `/me` authenticated) | Rate-limited login |
| `/tracking/*` | None | **S1-H03** open redirect |
| `/webhooks/mail/*` | None (signature optional) | **S1-H01, S1-H02** |
| All business routers | `requireAuth` (+ `requirePermission` on sensitive routes post PR #79) | RBAC hardened in Stage 2 |

---

## 2. Frontend ↔ backend alignment

### 2.1 Static integrity gate

**Executed:** `node scripts/rc1-api-integrity.mjs` (2026-07-10)

| Metric | Value |
|--------|-------|
| Frontend `apiClient` calls | 165 |
| Backend routes | 202 |
| Matched | **165** |
| Missing backend | **0** |
| Orphan backend routes | **41** |
| Next.js pages | 54 |

**Result:** **PASS** — every `apiClient` path in `apps/frontend/src/services/` resolves to a backend handler.

### 2.2 API coverage gate

**Executed:** `node scripts/rc1-api-coverage.mjs` (2026-07-10)

| Metric | Value |
|--------|-------|
| Placeholder UI strings | **0** |
| API integrity | **PASS** |

Report artifact written to `docs/generated/RC1-api-coverage.md`.

### 2.3 Orphan backend routes (41)

Routes exist on the API but are **not** called via `apps/frontend/src/services/apiClient`. Many are intentional:

| Category | Examples | Assessment |
|----------|----------|------------|
| Registration validation | `GET /borrowers/check-phone`, `check-id`, `check-name`, … | Called from registration UI via direct `fetch` or form hooks — **not a gap**; integrity script scope is `services/` only |
| Webhooks / tracking | `POST /webhooks/mail/*`, `GET /tracking/pixel/:token` | Server-to-server / email infrastructure |
| Reports (direct) | `GET /reports/daily-collection`, `loan-portfolio`, `financial-ledger` | May be consumed by export jobs or future UI |
| Collector portal | `GET /collector/:id/dashboard` | Separate portal module |
| Organization holidays | CRUD on `/organization-holidays` | **New in v1.3.0** — frontend may call via BFF paths not yet in `services/` or via hooks outside scanned dir |
| Photo capture token | `GET /photo-capture/sessions/:token` | Token-gated public read |

**Finding A4-G06 (Low):** Orphan count is expected for a BFF architecture but the integrity gate does not scan `features/`, hooks, or inline `fetch`. Consider extending the script or documenting intentional orphans.

### 2.4 BFF proxy alignment

`apps/frontend/src/app/api/wilms/[...path]/route.ts` proxies to `WILMS_API_UPSTREAM` with:

- Session cookie → `Authorization: Bearer` header forwarding
- CSRF validation on mutating methods
- Path passthrough: `/api/wilms/borrowers` → `{upstream}/borrowers`

Frontend `API_BASE_URL` normalizes to `{host}/api/wilms` (`apps/frontend/src/config/api.ts`). Dual backend mount at root makes this work without `/api/v1` in the proxy path.

---

## 3. Database schema review

### 3.1 Inventory

| Artifact | Count | Source |
|----------|-------|--------|
| SQL migration files | 21 | `apps/backend/src/db/migrations/0000_init.sql` … `0020_v130_field_operations.sql` |
| Journal entries | 21 | `meta/_journal.json` |
| Drizzle `pgTable` definitions | 56 | `apps/backend/src/db/schema/**/*.ts` |
| Drizzle `pgEnum` definitions | 37 | `apps/backend/src/db/schema/enums.ts` + module enums |
| Explicit `CREATE INDEX` in migrations | ~42 | Across 0001–0020 |

Schema modules exported from `apps/backend/src/db/schema/index.ts`: users/RBAC, borrowers, groups, loan pools, financial adjustments/reversals/reconciliations, loans/schedules/disbursements, ledger, payments, expenses, notifications, uploads, audit, offline sync, risk flags, settings, messages, registration drafts, photo capture, Ghana locations, communications platform, organization holidays.

### 3.2 Referential integrity

Initial migration `0000_init.sql` defines **22 foreign keys** on core entities (borrowers → users, payments → borrowers/collectors, group_members → groups/borrowers, etc.). Later migrations add FKs for financial workflows, communications, and admin fees. Drizzle schema uses `.references()` on ~70 columns across schema files.

**Observation:** Nearly all FKs use `ON DELETE no action` — deletes must be orchestrated in application code (consistent with soft-delete patterns on `borrowers.deleted_at`).

### 3.3 Indexes

**Present (verified in migrations):**

- Financial workflow: `financial_adjustments_status_requested_at_idx`, `financial_reversals_*`, `financial_reconciliations_collector_date_*`
- Loan pools: `loan_pools_status_idx`, `pool_allocations_pool_id_idx`
- Communications: `message_deliveries_*`, `communication_messages_status_idx`
- Offline sync: `offline_sync_idempotency_idx` (unique), status indexes
- Idempotency: `idempotency_scope_actor_key_idx` (unique composite)
- Ghana locations: region/district/city uniqueness indexes
- v1.3.0: `organization_holidays_date_idx`, `loan_fee_charges_loan_idx`

**Missing (verified by absence in migration SQL):**

| Table.column | Query pattern | Finding |
|--------------|---------------|---------|
| `payments.borrower_id` | Filter payments per borrower; group financial aggregation | **A4-G04** |
| `payments.collector_user_id` | Collector reconciliation, dashboards | **A4-G04** |
| `group_members.group_id` / `borrower_id` | Group member resolution | **A4-G04** |
| `borrowers.deleted_at` | `WHERE deleted_at IS NULL` on every list | **A4-G04** |
| `borrowers.status` | Status-filtered lists (`PENDING`, `APPROVED`) | **A4-G04** |
| `loans.borrower_id` | Loan eligibility, portfolio reports | **A4-G04** |

Drizzle schema files declare only **7** `index()` / `uniqueIndex()` helpers (offline-sync, idempotency-keys, ghana-locations, financial-reconciliations) — most indexes exist only in raw SQL migrations, not co-located in schema TS.

### 3.4 Enums and contract alignment

Postgres enums are generated from shared packages (`@wilms/shared-contracts`, `@wilms/shared-rbac`) in `enums.ts`, keeping API validation and DB constraints aligned for borrower status, user roles, payment status, expense categories, idempotency scopes, etc.

---

## 4. Persistence layer & transactions

### 4.1 Dual-mode persistence

`apps/backend/src/db/persistence.ts` delegates to either:

- **PostgreSQL** repositories (`apps/backend/src/repositories/`) when `DATABASE_URL` is set, or
- **In-memory** `store.ts` when database is disabled

`isDatabaseEnabled()` appears in **80+** call sites across services. Production health confirms `database.connected: true`; memory path is used for local demo and CI without DB.

**Finding A4-G05 (Medium):** Behavioral parity between memory and DB paths is tested partially (`empty-database/list-handlers.test.ts`) but not exhaustively. A service bug fixed only in one branch would not surface in demo mode.

### 4.2 Transaction boundaries

`runInTransaction` (`apps/backend/src/db/client.ts`) is used in:

| Module | Operations |
|--------|------------|
| loans/service | Disbursement, status transitions |
| payments/service | Payment recording |
| payments/payment-reversal.service | Atomic reversal + ledger |
| adjustments/service | Create, approve, reject |
| reconciliation/service | Submit reconciliation |
| sync/service | Offline operation replay |

**Verified positive (A4-P02):** Financial mutations that require atomicity document and use `runInTransaction`.

### 4.3 Idempotency

`idempotency_keys` table (migration `0001`) with unique index on `(scope, actor_user_id, idempotency_key)`. `runWithIdempotency` wraps loan creation, payment recording, and payment reversal — replay returns cached response.

### 4.4 In-memory admin-fee cache

`apps/backend/src/modules/transactions/service.ts` maintains `adminFeeTransactions = new Map()` alongside `borrower_admin_fees` DB table (migration `0018`). When DB is enabled, writes go to DB; the Map still serves as a process-local cache.

**Finding A4-G07 (Medium):** Multi-instance Railway deploys could serve stale admin-fee status from Map on a cold instance until DB read occurs. Low traffic today but worth unifying on DB-only reads.

---

## 5. Scalability & query patterns

### 5.1 Unbounded list endpoints

| Endpoint / function | Pattern | Risk |
|-------------------|---------|------|
| `borrowerRepository.listBorrowers()` | `SELECT * FROM borrowers WHERE deleted_at IS NULL` — no LIMIT | **A4-G03** |
| `paymentRepository.listPayments()` | Full table scan | **A4-G03** |
| `groups/service.listGroupsResponse()` | `Promise.all([loadGroupRows(), listBorrowers(), listPayments()])` then in-memory aggregation | **A4-G09** |
| `transactions/listBorrowersAwaitingAdminFee` | Filters full borrower list in memory | **A4-G03** |

Communications delivery logs and some settings queries use `.limit(n)` — pagination is **inconsistent** across domains.

### 5.2 N+1 assessment

Group list avoids per-row DB round-trips by prefetching all borrowers and payments (trade-off: memory over N+1). Loan and payment services fetch borrower per operation in some paths (`getBorrower` in loops for batch exports) — acceptable at current scale, problematic at 10k+ borrowers without batching.

**Not verified:** EXPLAIN ANALYZE on production-sized data (no DB access).

---

## 6. Production drift

### 6.1 `/health` snapshot (2026-07-10)

```json
{
  "version": "1.2.1",
  "migrations": { "expected": 17, "applied": 17, "latestAppliedAt": "1783179200000", "status": "ok" },
  "schema": { "status": "ok", "missingTables": [] },
  "database": { "connected": true }
}
```

| Dimension | Production (live) | Repo `main` @ `3762944` |
|-----------|-------------------|-------------------------|
| API package version | 1.2.1 | 1.3.1 |
| Applied migrations | 17 | 21 expected |
| Latest migration | `0016_v120_communication_platform` | `0020_v130_field_operations` |
| Git commit | `1f0b12f…` | `3762944` |

### 6.2 Migrations not in production

| Tag | Notable schema |
|-----|----------------|
| `0017_auth_otp_challenges` | OTP login table + index |
| `0018_v122_security_user_lifecycle` | `borrower_admin_fees`, password reset hardening |
| `0019_v123_platform_stabilization` | Platform fixes |
| `0020_v130_field_operations` | `organization_holidays`, `loan_fee_charges` |

**Finding A4-G01 (High — operational):** Production schema lags repo by 4 migrations. Features coded against `0017`–`0020` (OTP auth, admin fees persistence, organization holidays, loan fee charges) may **fail at runtime** or **no-op** until deploy + `drizzle-kit migrate`. Health reports `schema.status: ok` because `verifyCoreApplicationTables()` only checks 12 core tables from migrations 0000–0010 — **not** tables introduced in 0017–0020.

---

## 7. Findings summary

| ID | Severity | Area | Finding |
|----|----------|------|---------|
| **A4-G01** | **High** | Deploy / DB | Production 17 migrations vs repo 21; missing OTP, admin fees, holidays, loan fee charges tables |
| **A4-G02** | Medium | API | Dual mount (`/api/v1` + root) doubles route registration; increases review surface for auth middleware gaps |
| **A4-G03** | Medium | API / DB | Core list endpoints lack pagination; full-table reads |
| **A4-G04** | Medium | DB | Missing indexes on `payments.borrower_id`, `payments.collector_user_id`, `group_members`, `borrowers.status`, `borrowers.deleted_at` |
| **A4-G05** | Medium | Architecture | `isDatabaseEnabled()` dual persistence path; demo vs production behavioral drift risk |
| **A4-G06** | Low | Tooling | 41 orphan routes; integrity gate scans `services/` only |
| **A4-G07** | Medium | API / DB | Admin-fee `Map` cache alongside DB in `transactions/service.ts` |
| **A4-G08** | Low | CI | `npm run type-check` fails: `borrower-list-rbac.test.ts` TS2339 (`AddressInfo.port`) |
| **A4-G09** | Medium | Performance | `listGroupsResponse` loads entire borrowers + payments tables per request |
| **A4-G10** | Info | BFF | Proxy relies on root mount; `/api/v1` clients must use full prefix |

### Verified positives

| ID | Detail |
|----|--------|
| **A4-P01** | API integrity: 165/165 frontend calls matched (0 missing) |
| **A4-P02** | Financial writes use `runInTransaction` |
| **A4-P03** | Idempotency keys + `runWithIdempotency` on payments/loans/reversals |
| **A4-P04** | 56 Drizzle tables, 37 enums, 21 sequential migrations with journal |
| **A4-P05** | Health endpoint exposes DB, migration, schema, upload provider status |
| **A4-P06** | FK constraints on core entities; soft-delete on borrowers |
| **A4-P07** | Backend Vitest **90/90** pass (includes new `borrower-list-rbac.test.ts`) |

---

## 8. Runtime evidence (this session)

| Check | Result | Notes |
|-------|--------|-------|
| `node scripts/rc1-api-integrity.mjs` | **PASS** | 165 matched, 0 missing |
| `node scripts/rc1-api-coverage.mjs` | **PASS** | 0 placeholders |
| `npm run test -w @wilms/api` | **PASS** | 26 files, 90 tests, 3.7s |
| `npm run type-check` | **FAIL** | 1 error in `borrower-list-rbac.test.ts` (frontend passes; backend test file only) |
| Production `GET /health` | **200** | v1.2.1, 17 migrations, DB connected |
| EXPLAIN / query perf | **Not run** | No `DATABASE_URL` |
| Staging API contract tests | **Not run** | No credentials |

---

## 9. Cross-stage references

| Stage 4 item | Related prior finding |
|--------------|----------------------|
| Webhook routes in orphan list | Stage 1 **S1-H01, S1-H02** (unauthenticated mail webhooks) |
| RBAC on list endpoints | Stage 2 remediation (PR #79) — `assertBorrowerListAccess`, `resolveUserPermissions` |
| Organization holidays API | Added in migration `0020` — not in production (A4-G01) |
| Offline expense sync | Stage 3 fix (PR #79) — uses `sync` module + `runInTransaction` |

---

## 10. Recommendations (report only — not implemented)

1. **Deploy alignment (A4-G01):** Run production migration to `0020` and bump API to v1.3.1; extend `verifyCoreApplicationTables()` to include tables from 0017–0020.
2. **Pagination (A4-G03, A4-G09):** Add cursor/limit query params to `/borrowers`, `/payments`, `/groups` list handlers; push aggregation to SQL where possible.
3. **Indexes (A4-G04):** Add migrations for `payments(borrower_id)`, `payments(collector_user_id)`, `group_members(group_id)`, `borrowers(status) WHERE deleted_at IS NULL`.
4. **Admin-fee consistency (A4-G07):** Remove in-memory `Map`; read/write `borrower_admin_fees` only.
5. **Integrity gate (A4-G06):** Extend scan to `apps/frontend/src/features/**` and `hooks/**` or publish orphan route allowlist.
6. **Type-check (A4-G08):** Fix `AddressInfo` narrowing in `borrower-list-rbac.test.ts` so CI type-check is green.

---

## 11. Next stage

**Stage 4.5 — Architecture Review** (`ARCHITECTURE_REVIEW.md`): module boundaries, shared packages, BFF vs direct API, offline sync architecture, and deployment topology.

---

*End of Stage 4 API & Database Review.*
