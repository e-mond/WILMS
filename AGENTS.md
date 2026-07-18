# AGENTS.md

WILMS (Women's Interest-Free Loan Management System) is an npm-workspaces + Turborepo monorepo:

- `apps/frontend` (`@wilms/frontend`) — Next.js 14 app, dev on port `3000`.
- `apps/backend` (`@wilms/api`, folder is `apps/backend`) — Express API, dev on port `4000`.
- `packages/shared-*` — shared contracts, rbac, types, utils, validation.

Standard commands live in the root `package.json` and `apps/*/package.json` scripts; see also `CONTRIBUTING.md` and `apps/backend/README.md`.

## Cursor Cloud specific instructions

- Dependencies for the whole monorepo install from the repo root with `npm ci` (the update script). **Node 22+** required (`engines`, `.nvmrc`, Docker `node:22`; CI uses Node 22).
- Backend needs no external services: with `DATABASE_URL` unset it runs on an in-memory store. Start it with `npm run dev:api` (serves `http://127.0.0.1:4000`, health at `/health`).
- The frontend defaults to **mock** data mode. To run it against the real backend you must create `apps/frontend/.env.local` (gitignored, so recreate it each fresh VM) with:
  ```
  NEXT_PUBLIC_API_BASE_URL=/api/wilms
  NEXT_PUBLIC_USE_MOCK=false
  WILMS_API_UPSTREAM=http://127.0.0.1:4000
  ```
  Then `npm run dev` (serves `http://127.0.0.1:3000`). The frontend proxies API calls via its BFF route at `/api/wilms/[...path]` to `WILMS_API_UPSTREAM`; that proxy enforces CSRF, so hit the API through the browser UI rather than raw curl against `:3000/api/wilms`.
- In-memory demo login accounts are defined in `apps/backend/src/seed/demo-users.ts`. Super Admin: `admin@wilms.demo` / `DemoAdmin1!` (other roles: collector/officer/approver/auditor `@wilms.demo`). Passwords are stored as plaintext for demo users and matched via a fallback in `verifyPassword`.
- `npm run lint` and `npm run test` (frontend) only cover `@wilms/frontend`; run backend tests explicitly with `npm run test -w @wilms/api`. `npm run type-check` covers both.
