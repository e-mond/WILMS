# Changelog

All notable changes to WILMS are documented in this file.

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
