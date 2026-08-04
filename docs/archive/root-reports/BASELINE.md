# WILMS — Stage 0 Baseline

**Audit stage:** 0 (Scoping & Baseline)  
**Date:** 2026-07-09  
**Repository:** `e-mond/WILMS`  
**Git ref audited:** `main` @ `8837ecb` (merge of PR #73, package version `1.3.1`)  
**Method:** Read-only repo inspection + local test/script execution in cloud agent workspace (no staging credentials, no authenticated production smoke).

---

## 1. Stack (verified from manifests)

| Layer | Technology | Source |
|-------|------------|--------|
| Monorepo | npm workspaces (`apps/*`, `packages/*`) | `package.json` L8–11 |
| Frontend | Next.js 14 App Router, React 18, TypeScript 5.6 | `apps/frontend/package.json` |
| UI state | Zustand 5, TanStack Query 5.59 | `apps/frontend/package.json` |
| Backend | Express 4, Drizzle ORM 0.38, Vitest 3.2 | `apps/backend/package.json` |
| Database | PostgreSQL (Neon via `@neondatabase/serverless`) | `apps/backend/package.json`, `README.md` L22 |
| Auth (API) | bcrypt, cookie session (`session.provider: hmac-signed-token` in prod health) | `apps/backend/package.json`, production `/health` response |
| Uploads (prod) | Cloudinary | production `/health` response |
| Shared packages | `@wilms/shared-rbac`, `shared-contracts`, `shared-types`, `shared-validation`, `shared-utils` | `packages/*/package.json` |
| Node engine | `>=20` (CI uses Node 22) | `package.json` L5–6, `.github/workflows/ci.yml` L21 |

**Deployment targets (documented, not verified deploy pipeline end-to-end):**

| Service | Platform | URL (from `README.md` L18–21) |
|---------|----------|----------------------------------|
| Frontend | Vercel | https://wilms.vercel.app |
| API | Railway | https://wilms-production.up.railway.app |

---

## 2. Repository layout (verified)

```
wilms/
├── apps/frontend/     # Next.js UI + BFF proxy, Vitest unit tests, Playwright e2e/
├── apps/backend/      # Express API, Drizzle schema/migrations, Vitest tests, verification harnesses
├── packages/          # 5 shared packages (RBAC, contracts, types, validation, utils)
├── docs/              # Architecture, deployment, security, field-ops guides + large docs/archive/
├── scripts/           # CI gates: api-integrity, api-coverage, bundle/perf budgets, version verify
└── .github/workflows/ # ci.yml, deploy-staging.yml, deploy-production.yml
```

**Database migrations on disk:** 21 SQL files (`apps/backend/src/db/migrations/0000_init.sql` through `0020_v130_field_operations.sql`).

---

## 3. Roles in code (scope note for Stage 2)

Canonical `USER_ROLE` values in `packages/shared-rbac/src/roles.ts` L1–7:

- `SUPER_ADMIN`, `COLLECTOR`, `REGISTRATION_OFFICER`, `APPROVER`, `AUDITOR`

**Not verified as first-class auth roles in RBAC package:** Administrator, Group Leader, Borrower (may exist as domain/group concepts elsewhere — Stage 2 must map separately).

Permissions are defined in `packages/shared-rbac/src/permissions.ts` (49 permission constants) and assigned per role in `packages/shared-rbac/src/role-permissions.ts`.

---

## 4. Test tooling & results (executed in this workspace)

### 4.1 Backend — Vitest (`npm run test -w @wilms/api`)

| Git ref | Result | Evidence |
|---------|--------|----------|
| `main` @ `8837ecb` | **PASS** — 25 files, **85 tests** | Run 2026-07-09, exit code 0 |
| `cursor/v1.3.2-field-ops-8847` @ `abdb28c` | **PASS** — 26 files, **88 tests** | Run 2026-07-09 (includes holiday-schedule tests not on `main`) |

### 4.2 Frontend — Vitest sharded (`npm run test` → `--shard=1/2` + `--shard=2/2`)

| Shard | Result in this workspace | Evidence |
|-------|------------------------|----------|
| Shard 1/2 | **PASS** — 83 files, **231 tests** (with `NODE_OPTIONS=--max-old-space-size=12288`) | Run 2026-07-09 on v1.3.2 branch |
| Shard 2/2 | **Not verified** — JavaScript heap OOM (`Allocation failed`) even with 12GB heap | `/tmp/fe-shard2-retry.log` |
| Full `npm run test` (default heap) | **FAIL** — OOM during run | `/tmp/frontend-test.log` shows shard 1 passed then worker crash |

**Frontend test inventory:** 166 test files under `apps/frontend/src/tests/` and `**/*.{test,spec}.{ts,tsx}` per `vitest.config.ts` L16–17.

**CI expectation:** `.github/workflows/ci.yml` L57–58 runs `npm run test` (both shards) on `ubuntu-latest` without explicit `NODE_OPTIONS`. **CI pass/fail on latest `main` — not verified in this session** (requires GitHub Actions run inspection).

### 4.3 E2E — Playwright (`npm run test:e2e`)

- **15 spec files** under `apps/frontend/e2e/` (e.g. `accessibility.spec.ts`, `role-journeys.spec.ts`, `collector-shell.spec.ts`).
- **Not verified** — requires `npm run test:e2e:install`, running app/API, and credentials. No Playwright run executed in this session.

### 4.4 Smoke / live verification harnesses (backend)

Scripts exist in `apps/backend/package.json` (e.g. `smoke:production`, `smoke:rbac`, `smoke:staging`, `verify:live`, multiple `cert:*` scripts).

**Not verified** — require `WILMS_APP_URL`, `WILMS_API_URL`, `WILMS_SMOKE_EMAIL`, `WILMS_SMOKE_PASSWORD` (see root `package.json` L30–32, `README.md` L74). These secrets are **not available** in the cloud agent environment.

### 4.5 Static CI gate scripts (executed on `main`)

| Script | Result |
|--------|--------|
| `npm run type-check` | **PASS** (frontend + API) |
| `npm run verify:api-integrity` | **PASS** |
| `npm run verify:api-coverage` | **PASS** (54 pages, 0 placeholder hits) |
| `npm run lint` | **FAIL** — `@typescript-eslint/no-unused-vars`: `OfflinePaymentQueueItem` unused in `apps/frontend/src/hooks/useOfflineQueueSync.ts` L12 (**present on v1.3.2 branch only; `main` @ `8837ecb` lint status not re-run**) |

---

## 5. CI/CD (static review)

**Workflow:** `.github/workflows/ci.yml`

On `push`/`pull_request` to `main` and `release/**`:

1. `npm ci`
2. `type-check`, `lint`, `verify:api-integrity`, `verify:api-coverage`, `verify:mock-guard`
3. `build` (frontend with mock flags off)
4. `bundle:budget-check`, `perf:budget-check`
5. Backend + frontend tests
6. Separate `security` job: `npm audit --audit-level=critical`, gitleaks

**Staging deploy:** `.github/workflows/deploy-staging.yml` — runs after successful CI on `main` **only if** `vars.ENABLE_STAGING_DEPLOY == 'true'`. Uses GitHub `staging` environment secrets (`STAGING_DATABASE_URL`, `WILMS_STAGING_API_URL`, smoke credentials, etc.).

**Production deploy:** `.github/workflows/deploy-production.yml` — `workflow_dispatch` with manual `confirm: deploy`.

---

## 6. Environment reachability (this session)

| Target | Reachable? | Evidence |
|--------|------------|----------|
| Production API `/health` | **Yes** (unauthenticated) | `curl` HTTP 200, 2026-07-09 |
| Production frontend | **Partial** | `curl` HTTP 307 to Vercel (no authenticated UI session) |
| Staging API/app | **Not verified** | Requires GitHub/org secrets; no URLs or credentials in agent env |
| Local dev API + DB | **Not verified** | No `DATABASE_URL` or full `.env` configured in agent workspace |

### Production `/health` snapshot (verified 2026-07-09)

```json
{
  "version": "1.2.1",
  "environment": "production",
  "database": { "connected": true },
  "migrations": { "expected": 17, "applied": 17, "status": "ok" },
  "uploads": { "activeProvider": "cloudinary", "valid": true }
}
```

**Observation (factual, not scored):** Repo `main` package version is `1.3.1` with **21** migration files on disk; production API reports version **1.2.1** with **17** applied migrations. Deploy alignment is a known gap to investigate in later stages — **root cause not verified in this session**.

---

## 7. What later stages can verify (gating matrix)

| Stage | Static review (repo only) | Dynamic / live verification |
|-------|---------------------------|-----------------------------|
| 1 Security | Yes — middleware, routes, grep secrets | **Gated:** IDOR/privilege tests need staging or prod credentials + non-destructive test accounts |
| 2 RBAC | Yes — matrix from `shared-rbac` + route middleware | **Gated:** out-of-role HTTP attempts need reachable API + session tokens |
| 3 User journeys | Yes — code-path trace | **Gated:** E2E pass/fail needs Playwright run or manual staging |
| 4 API/DB | Yes — routers + migrations | Partial — EXPLAIN/query perf needs DB access |
| 4.5 Architecture | Yes — folder/module graph | N/A |
| 5 Frontend/a11y/perf | Partial — dead-code grep, bundle scripts | **Gated:** Lighthouse/axe need running build + browser; bundle analyzer needs `npm run build` |
| 6 Cleanup | Yes — reference grep | N/A |
| 7 Documentation | Yes — doc vs code diff | N/A |
| 8 Readiness rollup | Uses only upstream verified findings | N/A |

---

## 8. Existing documentation index (verified paths)

| Category | Primary paths |
|----------|----------------|
| Entry | `README.md`, `CHANGELOG.md`, `PROJECT_STATUS.md` |
| Architecture | `docs/architecture/architecture.md`, `docs/architecture/README.md` |
| Operations | `docs/deployment-guide.md`, `docs/production-guide.md`, `docs/security-guide.md` |
| Field ops (v1.3+) | `docs/offline-architecture.md`, `docs/synchronization-guide.md`, `docs/device-management.md`, `docs/mobile-guide.md`, `docs/advanced-lending.md`, `docs/api-overview.md` |
| Historical | `docs/archive/` (large; RC/certification-era material) |

---

## 9. Stage 0 gate checklist

| Gate question | Answer |
|---------------|--------|
| What is the stack? | TypeScript monorepo: Next.js 14 + Express + PostgreSQL + Drizzle + shared RBAC packages (Section 1) |
| What test tooling exists? | Vitest (unit/integration), Playwright (e2e), backend smoke/cert scripts (Section 4) |
| Does it currently pass? | API tests **pass** on `main` (85/85). Frontend shard 1 **passes** (231 tests); full frontend suite **not verified** in this workspace due to OOM on shard 2. Lint **fails** on v1.3.2 branch (unused import). CI status on GitHub **not verified** here. |
| Is there a staging environment engineers can hit? | **Configured in CI** (`deploy-staging.yml`) but **not reachable by this agent** — requires org secrets and `ENABLE_STAGING_DEPLOY`. Production API health endpoint is publicly reachable; authenticated flows **not verified**. |
| What is already documented? | See Section 8; `README.md` current-release table lags package version (`README.md` L7–9 lists v1.3.0; `package.json` on `main` is `1.3.1`). |

---

## 10. Recommended ticket order (no work started beyond Stage 0)

1. **Stage 0** — `BASELINE.md` (this file) ✅  
2. **Stage 1** — `SECURITY_ASSESSMENT_REPORT.md`  
3. **Stage 2** — `ROLE_CERTIFICATION_REPORT.md`  
4. **Stage 3** — `USER_FLOW_CERTIFICATION.md`  
5. **Stage 4** — `API_AND_DATABASE_REVIEW.md`  
6. **Stage 4.5** — `ARCHITECTURE_REVIEW.md`  
7. **Stage 5** — `FRONTEND_PERFORMANCE_ACCESSIBILITY_REPORT.md`  
8. **Stage 6** — `FEATURE_UTILIZATION_AND_CLEANUP_REPORT.md`  
9. **Stage 7** — `DOCUMENTATION_REVIEW.md`  
10. **Stage 8** — `PRODUCTION_READINESS_REPORT.md` + `IMPROVEMENT_ROADMAP.md`

Each subsequent stage should be a **separate session/branch/PR** with only its deliverable file(s), using the gating rules in Section 7.

---

## 11. Open items for audit infrastructure (not fixes)

- Provision **staging URLs + smoke credentials** to the audit environment for Stages 1–3 dynamic checks, or accept explicit "not verified" cells.
- Resolve **frontend Vitest OOM** in constrained environments (CI may pass; local/agent runs may need `NODE_OPTIONS` or pool tuning) before relying on local frontend test gates.
- Confirm **production deploy** has applied migrations `0018`–`0020` and version `1.3.x` before scoring production readiness in Stage 8.
