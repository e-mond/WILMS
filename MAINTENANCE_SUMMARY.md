# Repository Structure

`	ext
wilms/
+-- apps/
¦   +-- backend/                 Express API, Drizzle schema, verification harnesses
¦   +-- frontend/                Next.js UI, BFF routes, services, tests, E2E
+-- packages/                    Shared contracts, RBAC, validation, types, utilities
+-- data/ghana-locations/        Ghana regions, districts, cities seed data
+-- docs/
¦   +-- architecture/            Current architecture docs
¦   +-- engineering/             Current engineering guides
¦   +-- archive/                 Historical v1.0.0 and pre-v1.0 evidence
¦   +-- generated/               Script-generated verification output (created as needed)
+-- scripts/                     Root verification and budget scripts
+-- .github/workflows/           CI, staging deploy, production deploy
+-- Dockerfile                   Railway API image from monorepo root
+-- railway.toml                 Railway service config
+-- vercel.json                  Vercel frontend config
+-- package.json                 npm workspace scripts
`

## Authoritative docs

- README.md
- PROJECT_STATUS.md
- CHANGELOG.md
- docs/architecture/architecture.md
- docs/deployment-guide.md
- docs/security-guide.md
- docs/production-guide.md
"@ | Set-Content REPOSITORY_STRUCTURE.md -NoNewline

@"
# Maintenance Summary

**Branch:** elease/v1.0.1-maintenance  
**Release target:** v1.0.1  
**Mode:** Maintenance only

## Completed

- Archived historical v1.0.0/RC1 reports.
- Removed one proven-unused component.
- Redirected generated script outputs to docs/generated/.
- Updated current root documentation for v1.0.1 maintenance.
- Applied non-breaking npm audit changes.
- Documented remaining dependency and technical-debt risks.

## Not changed

- No business features added.
- No production migrations removed.
- No production verification scripts removed.
- No mock/demo infrastructure removed where still used by tests/dev/reference seed flows.

## Required before merge

Run full verification and open a PR. Do not merge directly to main.