# RC1 System Audit

**Date:** 2026-07-01

## Architecture

```
Browser → Vercel (Next.js + BFF /api/wilms) → Railway (Express API) → PostgreSQL (Neon)
```

- Monorepo: npm workspaces (`apps/frontend`, `apps/backend`, `packages/*`)
- Shared contracts: `@wilms/shared-contracts`, `@wilms/shared-rbac`
- Data provider pattern: mock (dev/test) vs API (production)

## Maintainability

| Area | Assessment |
|------|------------|
| Module structure | Backend modules mirror domain boundaries |
| Service layer | Frontend `@/services` with webpack alias switching |
| Types | Shared packages reduce drift |
| Migrations | Drizzle SQL migrations 0000–0009 (10 files) |
| Tests | 206 frontend + 16 backend unit tests |

## Technical debt (documented)

- Orphan backend routes (29) — detail/sub-resource endpoints not in service facades
- Next.js 14 → 15 upgrade path for security advisories
- Group/pool creation workflows UI-only (toast: "not yet available")
- User invite without automated welcome email

## Verdict

Architecture sound for RC1. Debt items tracked in RC1-next-roadmap.md.
