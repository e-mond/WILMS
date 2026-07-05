# Repository Structure

```text
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
¦   +-- generated/               Script-generated verification output (ignored)
+-- scripts/                     Root verification and budget scripts
+-- .github/workflows/           CI, staging deploy, production deploy
+-- Dockerfile                   Railway API image from monorepo root
+-- railway.toml                 Railway service config
+-- vercel.json                  Vercel frontend config
+-- package.json                 npm workspace scripts
```

## Authoritative Docs

- `README.md`
- `PROJECT_STATUS.md`
- `CHANGELOG.md`
- `docs/architecture/architecture.md`
- `docs/deployment-guide.md`
- `docs/security-guide.md`
- `docs/production-guide.md`

## Archive Layout

- `docs/archive/v1.0.0-rc1.4/` - root RC1/v1.0.0 evidence reports
- `docs/archive/page-validation/` - historical phase validation and certification reports