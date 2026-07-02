# Changelog

All notable changes to WILMS are documented in this file.

## [Unreleased] — RC1.3.2 post-deployment verification

### Documented
- RC1.3.2 evidence set (12 reports under `docs/page-validation/RC1.3.2-*.md`)
- Live production smoke **17/29**, RBAC **7/11** (2026-07-02)
- Railway deploy SHA drift: `cf3ce10` vs GitHub `main` `8a83278`
- Verdict: **NOT PRODUCTION CERTIFIED**

## [Unreleased] — RC1.2 pre-v1.0.0 validation

### Added
- RC1.2 evidence set (13 reports under `docs/page-validation/RC1.2-*.md`)
- Lighthouse login audit artifact (`rc1.2-evidence/lighthouse-login.json`)
- Production verification refresh (smoke 29/29, rbac 11/11)

### Documented
- Staging DB demo cleanup blocked (no staging `DATABASE_URL` in repo)
- Dependency audit: 0 critical, 9 high (non-blocking)
- Recommendation: **READY FOR RC2** pending staging cleanup + E2E re-run

## [Unreleased] — RC1.1 production stabilization

### Added
- `smoke:rbac` production RBAC probes
- `verify:mock-guard` CI gate for features/
- Content-encoding checks in `smoke:production`
- Connection status: online, offline, reconnecting, sync pending
- RC1.1 audit documentation set (20+ reports)

### Fixed
- Stale bundle: SW cache v2, controllerchange reload, vercel cache headers
- Loading policy on super-admin, approver, collector management panels

### Changed
- `ConnectionStatusChip` labels aligned to spec (Online/Offline/Reconnecting/Sync pending)
- CI: mock import guard step

## [Unreleased] — RC1.1 / v1.0.0 readiness (hotfix)

### Fixed
- Router-level RBAC blocking unrelated API paths for collectors (403 on notifications, capture-sessions, collector dashboard)
- Collector portal self-access: `assertCollectorAccess()` on dashboard and borrowers routes
- `resolveCollectorDisplayId` now preserves readable IDs like `COL-011` (CI fix)
- Admin-fee collector panel no longer calls approver-only `/disbursement-eligibility`
- Removed synthetic reconciliation amounts when database is disabled

### Added
- Collector portal RBAC integration tests (`access.test.ts`, `rbac.test.ts`)
- `entity-display-id.test.ts` unit tests
- RC1.1 audit documentation (`docs/page-validation/RC1.1-*.md`)

### Security
- Per-route permission guards replace router-level `use(requirePermission)` on collectors, reports, groups, dashboard, analytics, risk-flags, photo-capture

## [0.2.2] - 2026-06-30

### Added
- Staged CI/CD: enhanced `ci.yml`, `deploy-staging.yml`, manual-approval `deploy-production.yml`
- Bundle and performance budget scripts (`bundle:budget-check`, `perf:budget-check`)
- Offline sync backend: `POST /sync/offline/batch`, conflict review endpoints, migration `0007_offline_sync`
- Version consistency script (`verify:version`)
- Route-level loading states (collector, approver)
- P14.6 audit and validation documentation

### Security
- Production mock-flag guard on API startup
- Secret scan (gitleaks) and `npm audit` in CI
- `apiClient` no longer redirects to session-expired on 401 while on `/login`

### Changed
- Offline payment replay routes through sync API (financial ops queued for review)
- PWA install banner only calls `preventDefault` when custom UI will show

## [0.2.1] - 2026-06-20

### Added
- BFF synchronizer-token CSRF protection (`wilms_csrf` cookie + `x-wilms-csrf` header)
- `GET /api/auth/csrf` token issuance endpoint
- Expanded `/health`: version, git commit, uptime, runtime (node, deployedAt, buildId)
- Version label on dashboard footer (`OfficeShellFooter`)
- Production demo-user rotation script (`rotate-production-users.mjs`)
- P14.5G audit and validation documentation

### Security
- CSRF validation on `/api/auth/login`, `/api/auth/logout`, and BFF mutations
- Helmet: explicit HSTS, `hidePoweredBy`, `referrerPolicy: no-referrer`
- Production smoke tests for CSRF rejection and expanded health checks

### Changed
- Version bumped to **0.2.1** (semantic versioning — production hardening patch)
- `getAppVersionLabel()` format: `WILMS v{version}` from root `package.json`

## [0.2.0] - 2026-06-29

### Added
- Production domain `https://wilms.vercel.app` with Vercel alias and env configuration
- Application version badge (login, sidebar, settings) from root `package.json`
- Health endpoint migration count via `drizzle.__drizzle_migrations`
- P14.5E/F/G release and deployment evidence documentation
- Production smoke test harness (`npm run smoke:production`)
- Railway Dockerfile deployment from monorepo root
- Root `vercel.json` for monorepo Vercel builds

### Security
- Disabled Vercel SSO deployment protection for public production access
- `poweredByHeader: false` on Next.js
- CORS locked to production frontend domain
- Security review documentation (P14.5F/P14.5G)

### Fixed
- Railway deploy from `apps/backend` (wrong context) → repo root + Dockerfile
- Vercel `npm ci` failure (partial upload / wrong install path)
- Production smoke health envelope parsing (`data.status`)
- Health migration query (wrong table name)

### Known limitations
- Demo seed users remain in production Neon (replace before stakeholder rollout)
- CSRF not implemented — documented risk acceptance for financial-core release
- Legacy Vercel alias `frontend-ashen-gamma-11.vercel.app` still active

## [0.1.0] - Prior releases

Initial WILMS monorepo: Next.js frontend, Express API, Neon PostgreSQL, Cloudinary uploads, financial core certification.
