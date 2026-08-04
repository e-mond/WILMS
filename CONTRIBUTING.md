# Contributing to WILMS

Thank you for contributing to the Women's Interest-Free Loan Management System.

---

## Workflow

1. Branch from up-to-date `main` using a neutral, project-focused name (`feature/…`, `fix/…`, `docs/…`).  
2. Implement the change; keep financial, RBAC, idempotency, and audit controls intact.  
3. Update documentation when behavior or operations change.  
4. Run validation gates locally.  
5. Open a pull request to `main`.  
6. Do not merge platform cutovers without the human review checkpoints documented in `docs/v1.5/FINAL_RELEASE_READINESS.md`.

---

## Validation gates

```bash
npm run type-check
npm run lint
npm run test
npm run test -w @wilms/domain
npm run build
npm run verify:version
```

Add targeted financial / RBAC / notification verification when touching those areas:

```bash
npm run verify:financial -w @wilms/domain
npm run smoke:rbac -w @wilms/domain
npm run smoke:notifications -w @wilms/domain
```

---

## Code standards

- TypeScript strict mode.  
- Prefer shared packages (`@wilms/shared-*`, `@wilms/domain`) over duplicating domain rules in the UI.  
- Do not weaken maker-checker, idempotency, SQL financial aggregation, or audit logging.  
- Do not expose stack traces, SQL, or internal IDs to clients.  
- Do not add personal names, handles, or AI/tool attribution to commits, docs, UI, or metadata.

Architecture context: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), ADRs under [`docs/adr/`](docs/adr/).

---

## Documentation expectations

- Update the single source of truth under `docs/` (see [`docs/README.md`](docs/README.md)).  
- Do not edit frozen archives under `docs/archive/` or historical certification packs to “catch up” to current code—add a new current doc instead.  
- Record major documentation campaigns in [`DOCUMENTATION_REPORT.md`](DOCUMENTATION_REPORT.md).

---

## Release process

1. Version bump across root + workspace packages (keep `npm run verify:version` green).  
2. Update `CHANGELOG.md` and `VERSION.md`.  
3. Deploy Preview; run health + smoke.  
4. Promote Production; confirm Cron and health version.  
5. Only then merge if the work lived on a long-lived branch with checkpoints.

Details: [`docs/deployment-guide.md`](docs/deployment-guide.md).
