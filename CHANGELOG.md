# Changelog

All notable changes to WILMS are documented in this file.

## [Unreleased] — v1.0.1 maintenance

### Changed
- Archived historical RC1/v1.0.0 readiness reports from the repository root into `docs/archive/v1.0.0-rc1.4/`.
- Archived historical phase validation reports from `docs/page-validation/` into `docs/archive/page-validation/`.
- Redirected generated verification outputs from historical report paths to `docs/generated/`.
- Replaced stale root README status with v1.0.1 maintenance guidance.
- Updated app-lock documentation to reflect optional app lock behavior.

### Fixed
- Removed unused `AppLockRequiredGate` component after confirming it has no imports.
- Applied non-breaking `npm audit fix` changes to the package lock.

### Deferred
- Breaking dependency upgrades for `next`, `drizzle-orm`, Playwright, and ExcelJS/uuid transitive advisories.
- Removal of mock/demo infrastructure that is still required for tests, local development, or reference seeding.

## [1.0.0] — Production release

- Historical release evidence is preserved under `docs/archive/`.
- RC1.4 closure reports are archived under `docs/archive/v1.0.0-rc1.4/`.