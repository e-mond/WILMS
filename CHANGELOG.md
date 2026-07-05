# Changelog

All notable changes to WILMS are documented in this file.

## [Unreleased] — RC1.4 final closure (2026-07-05)

### Added
- `RC1.4_CLOSURE_REPORT.md` — closure assessment with evidence
- Registration draft autosave (debounced, all steps)
- Login/logout optional sound feedback
- Mobile QR capture simulate in API mode

### Fixed
- Mobile QR capture — `/capture/*` public middleware, upload completion, preview resolution
- Guarantor eligibility — pending registrations no longer count toward guarantee limit
- App lock optional — removed mandatory PIN setup gate on login
- A11y tests — Toast (`Dismiss`), Modal (`Close`), PasswordField (`Show/Hide password`)
- PendingApplicationReview tests — aligned with current button labels; audit is server-side
- Collector dashboard — network errors no longer conflated with empty loading state
- Connection status chip moved to bottom-right

### Verified (2026-07-05)
- Backend tests 53/53; frontend 224/224
- RBAC smoke 11/11; production smoke 31/32 (local `EXPECTED_GIT_COMMIT` stale)
- `verify:deploy-sync` PASS on `487708b`

## [Unreleased] — RC1.4 closure audit (2026-07-04)

### Added
- Full RC1 readiness audit deliverables (`PROJECT_READINESS_REPORT.md`, `FEATURE_COMPLETION_MATRIX.md`, `API_COVERAGE_REPORT.md`, `DATABASE_STATUS_REPORT.md`, `SECURITY_STATUS_REPORT.md`, `TEST_STATUS_REPORT.md`, `DEPLOYMENT_STATUS_REPORT.md`, `TECHNICAL_DEBT_REPORT.md`, `VERSION_1_READINESS.md`, `FINAL_RECOMMENDATION.md`)

### Fixed
- Registration review export gated on `REGISTER_BORROWERS` permission (`487708b`)
- Shell accessibility — icon buttons use visible or sr-only text; removed conflicting aria-label overrides (`487708b`)

### Verified (2026-07-04)
- Production deploy sync PASS on `487708b`
- RBAC smoke 11/11; production smoke 31/32 (local `EXPECTED_GIT_COMMIT` stale)
- Backend tests 52/52; frontend 217/220 (3 a11y test regressions)

## [0.2.2] — RC1.4 production (2026-07-04)

### Fixed
- Settings integration status embedded in GET `/settings`
- Mobile settings nav + guarantor photo URLs + admin dashboard export
- Role settings preferences wiring

### Merged
- PR #48 — `release/rc1-4-v1-certification` → `main`

## [Unreleased] — RC1.3.3 production recovery

### Added
- Schema health probes in `/health` (`schema.missingTables`)
- `verify:empty-db` — empty-database list handler verification
- RC1.3.3 recovery documentation

### Fixed
- Null-safe borrower `profile` and payment `gps` in repositories
- `gitCommit` in health uses `RAILWAY_GIT_COMMIT_SHA` / `VERCEL_GIT_COMMIT_SHA` fallbacks
- API error handler logs unhandled exceptions server-side

### Merged
- RC1.3 UX empty states, page descriptions, production error fixes (`release/rc1-3-final-certification`)

## [Unreleased] — RC1.3.2 post-deployment verification

### Documented
- RC1.3.2 evidence set (12 reports)
- Live production smoke **17/29**, RBAC **7/11**
- Verdict: **NOT PRODUCTION CERTIFIED**

## [Unreleased] — RC1.3 final certification

### Added
- Intelligent query error presentation and page descriptions
- RC1.3 certification documentation

### Fixed
- Empty datasets no longer shown as connection errors

## [Unreleased] — RC1.2 pre-v1.0.0 validation
