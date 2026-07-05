# Changelog

All notable changes to WILMS are documented in this file.

## [Unreleased] ? v1.1 user experience

### Added
- `QueryErrorState` for consistent error + retry UX across all feature panels.
- PWA assets (`favicon.ico`, `icon-192.png`, `icon-512.png`) and `npm run generate:pwa-icons`.
- Module guidance on collector, approver, officer, and executive dashboard pages (18 total).
- Guided empty states with why/how guidance and primary CTAs.
- Global search highlighting and improved ID/phone partial matching.
- Super-admin dashboard Recent Activity section.
- Notification inbox filters (All / Unread / Critical).

### Changed
- Migrated all remaining panels from generic connection errors to `GuidedEmptyState` / `QueryStatePanel`.
- Monorepo package version aligned to `1.0.0` (matches tagged production release).
- Collector dashboard: deduplicated KPI grid; expense summary shows errors instead of silent failure.

## [1.0.1] ? Maintenance

### Changed
- Archived historical RC1/v1.0.0 readiness reports into `docs/archive/v1.0.0-rc1.4/`.
- Archived historical phase validation reports into `docs/archive/page-validation/`.
- Redirected generated verification outputs to `docs/generated/`.
- Updated app-lock documentation to reflect optional app lock behavior.

### Fixed
- Removed unused `AppLockRequiredGate` component after confirming it has no imports.

### Reverted
- Non-breaking `npm audit fix` lockfile update reverted after Vitest/Vite type-check regression.

## [1.0.0] ? Production release

- Historical release evidence is preserved under `docs/archive/`.
- RC1.4 closure reports are archived under `docs/archive/v1.0.0-rc1.4/`.
