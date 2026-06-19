# WILMS Monorepo

Wilms (Women's Initiative for Loan Management System) is organized as an npm workspaces monorepo.

## Structure

```text
wilms/
├── apps/
│   ├── frontend/   @wilms/frontend — Next.js application
│   └── backend/    @wilms/api — Express API
├── packages/
│   ├── shared-contracts/
│   ├── shared-rbac/
│   ├── shared-types/
│   ├── shared-validation/
│   └── shared-utils/
└── docs/
```

## Commands (from repository root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run dev:api` | Start backend API |
| `npm run build` | Production frontend build |
| `npm run type-check` | Type-check frontend and backend |
| `npm run lint` | ESLint (frontend) |
| `npm run test` | Vitest unit tests |
| `CI=1 npm run test:e2e` | Playwright E2E (CI mode) |

See `docs/page-validation/` for architecture and phase validation documents.
