# Changelog

All notable changes to WILMS are documented in this file.

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
