
# AGENTS.md

You are acting as the Senior Frontend Engineer, Product Architect, Security Reviewer, QA Engineer, and Technical Lead for the **WILMS (Women's Interest-Free Loan Management System)** platform.

Your responsibility is to implement the approved product accurately, safely, and incrementally.

Do not write or modify application code until you have completed the required repository and documentation review for the current session.

---
WILMS (Women's Interest-Free Loan Management System) is an npm-workspaces + Turborepo monorepo:

- `apps/frontend` (`@wilms/frontend`) — Next.js 14 app, dev on port `3000`.
- `apps/backend` (`@wilms/api`, folder is `apps/backend`) — Express API, dev on port `4000`.
- `packages/shared-*` — shared contracts, rbac, types, utils, validation.

Standard commands live in the root `package.json` and `apps/*/package.json` scripts; see also `CONTRIBUTING.md`, `apps/backend/README.md`, and `packages/domain/README.md`.

## Cloud development environment notes

- Dependencies for the whole monorepo install from the repo root with `npm ci` (the update script). **Node 22+** required (`engines`, `.nvmrc`, Docker `node:22`; CI uses Node 22).
- Backend needs no external services: with `DATABASE_URL` unset it runs on an in-memory store. Start it with `npm run dev:api` (serves `http://127.0.0.1:4000`, health at `/health`).
- The frontend defaults to **mock** data mode. To run it against the real backend you must create `apps/frontend/.env.local` (gitignored, so recreate it each fresh VM) with:
  ```
  NEXT_PUBLIC_API_BASE_URL=/api/wilms
  NEXT_PUBLIC_USE_MOCK=false
  WILMS_API_UPSTREAM=http://127.0.0.1:4000
  ```
  Then `npm run dev` (serves `http://127.0.0.1:3000`). The frontend proxies API calls via its BFF route at `/api/wilms/[...path]` to `WILMS_API_UPSTREAM`; that proxy enforces CSRF, so hit the API through the browser UI rather than raw curl against `:3000/api/wilms`.
- In-memory demo login accounts are defined in `packages/domain/src/seed/demo-users.ts`. Super Admin: `admin@wilms.demo` / `DemoAdmin1!` (other roles: collector/officer/approver/auditor `@wilms.demo`). Passwords are stored as plaintext for demo users and matched via a fallback in `verifyPassword`.
- `npm run lint` and `npm run test` (frontend) only cover `@wilms/frontend`; run domain/API tests explicitly with `npm run test -w @wilms/domain`. `npm run type-check` covers both.



# PROJECT CONFIDENTIALITY AND CONTRIBUTOR ATTRIBUTION

This is a paid client project.

Do not add, reference, or expose the developer's personal name, username,
handle, brand, or personal identity anywhere in the project unless explicitly
requested by the project owner.

This applies to:

- Documentation
- README files
- Code comments
- JSDoc comments
- Commit messages
- Git branch names
- Pull request titles
- Pull request descriptions
- Changelog entries
- Release notes
- Package metadata
- Author fields
- Copyright notices
- Credits sections
- About pages
- Footer content
- UI text
- HTML metadata
- SEO metadata
- Structured data
- Generated files
- Test descriptions
- Fixture data
- Mock data
- Seed data
- File names
- Folder names
- Screenshots
- Demo content
- Console output
- Error messages

Do not use personal names, usernames, handles, or personal branding as:

- Branch names
- Commit authorship text
- Feature names
- Component names
- Variable names
- Test names
- Documentation references

Use neutral, project-focused naming instead.

Examples:

Good:

- `feature/applicant-dashboard`
- `feature/fund-foundations`
- `fix/application-status`
- `docs/architecture-update`

Avoid:

- `feature/<developer-name>-dashboard`
- `feature/<personal-brand>-feature`
- `fix/<developer-name>-fix`
- `<developer-name> implementation`

Do not add personal attribution or contributor credits unless the project owner
explicitly requests it.

Keep all project artifacts natural, professional, and focused on the product,
the organization, the users, and the implementation.

Do not make the project appear artificially branded around an individual
developer.

#  PHASE COMPLETION AND REMOTE BACKUP

Every implementation unit must be completed, validated, committed, and pushed
to its feature branch before the next unit begins.

The required sequence is:

1. Implement the unit.
2. Run all required validation.
3. Perform the required security review.
4. Update progress-tracker.md.
5. Commit the completed unit.
6. Push the feature branch to the approved remote repository.
7. Verify the remote branch exists.
8. Only then begin the next roadmap unit.

Never begin the next unit while the previous completed unit exists only locally,
unless explicitly instructed by the project owner.