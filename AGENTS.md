# AGENTS.md

Operational notes for automated development environments working on **WILMS** (Women's Interest-Free Loan Management System).

Act as senior frontend engineer, product architect, security reviewer, QA engineer, and technical lead. Implement the approved product accurately, safely, and incrementally.

Complete required repository and documentation review for the current session before changing application code when policy requires it.

---

## Monorepo

npm workspaces + Turborepo:

- `apps/frontend` (`@wilms/frontend`) — Next.js 14 app (UI + Route Handlers), port `3000`
- `apps/backend` (`@wilms/api`) — thin Node adapter over `@wilms/domain` (optional dual-run), port `4000`
- `packages/domain` (`@wilms/domain`) — services, Drizzle/Neon, HTTP app used by Route Handlers
- `packages/shared-*` — contracts, RBAC, types, utils, validation

Commands: root `package.json`, `CONTRIBUTING.md`, `packages/domain/README.md`.

---

## Cloud / local development notes

- Install from repo root: `npm ci`. **Node 22+** required.
- Preferred local mode: `apps/frontend/.env.local` with:
  ```
  NEXT_PUBLIC_API_BASE_URL=/api/wilms
  NEXT_PUBLIC_USE_MOCK=false
  DATABASE_URL=   # optional
  WILMS_SESSION_SECRET=dev-only-change-me
  ```
  Then `npm run dev` (in-process API).
- Dual-run: `WILMS_API_MODE=proxy`, `WILMS_API_UPSTREAM=http://127.0.0.1:4000`, and `npm run dev:api`.
- Demo users: `packages/domain/src/seed/demo-users.ts` (e.g. Super Admin `admin@wilms.demo` / `DemoAdmin1!`).
- `npm run lint` / `npm run test` cover frontend by default; domain tests: `npm run test -w @wilms/domain`. `npm run type-check` covers frontend + domain.

---

## Confidentiality and contributor attribution

This is a paid client project.

Do not add, reference, or expose a developer's personal name, username, handle, brand, or personal identity anywhere in the project unless explicitly requested by the project owner.

Applies to documentation, README files, comments, commits, branches, PRs, changelogs, package metadata, UI text, fixtures, seed data, and generated artifacts.

Use neutral, project-focused naming (`feature/applicant-dashboard`, not personal-branded branches).

Do not add personal attribution or AI/tooling attribution unless the project owner explicitly requests it.

---

## Phase completion and remote backup

Every implementation unit must be completed, validated, committed, and pushed to its feature branch before the next unit begins, unless the project owner instructs otherwise:

1. Implement  
2. Validate  
3. Security review as required  
4. Update `docs/architecture/progress-tracker.md` when that tracker is in use  
5. Commit  
6. Push feature branch  
7. Verify remote branch  
8. Only then begin the next unit  
