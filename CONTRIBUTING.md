# Contributing to WILMS

Thank you for contributing to the WILMS financial platform.

## Development workflow

1. Branch from `main` using the team branch prefix policy (Cloud agents: `cursor/<descriptive-name>-####`).
2. Implement with validation gates after each major block.
3. Update documentation when behaviour or architecture changes.
4. Push and open a PR against `main`.

See [docs/engineering/branching-strategy.md](docs/engineering/branching-strategy.md) for branch naming and merge policy.

**Architecture SSoT:** [docs/certification/v1.3.8/enterprise-architecture/SYSTEM_ARCHITECTURE.md](docs/certification/v1.3.8/enterprise-architecture/SYSTEM_ARCHITECTURE.md)

**Permission matrix:** [docs/permission-matrix.md](docs/permission-matrix.md)

## Code quality

Every new backend file should include:

- **File header** — module purpose.
- **Architectural comments** — persistence boundaries, transaction scope, RBAC expectations.
- **Business-rule comments** — financial calculations, state transitions, invariants.
- **Transaction comments** — what is atomic and what rolls back together.
- **Repository comments** — query intent and index assumptions.

Complex financial logic must be explained inline. Never leave undocumented balance or ledger calculations.

## Validation gates

Run after every major implementation block:

```bash
npm run type-check
npm run lint
npm run build
npm run test
```

Backend domain verification (when applicable):

```bash
npm run verify:financial -w @wilms/api
npm run verify:pools -w @wilms/api
npm run verify:adjustments -w @wilms/api
```

Backend unit tests:

```bash
npm run test -w @wilms/api
```

If any gate fails: stop, fix, re-run, then continue.

## Documentation

When merging financially or architecturally significant work, update:

- `docs/financial-calculations.md` — if formulas change
- `docs/certification/v1.3.8/enterprise-architecture/` — for architecture decisions
- `docs/certification/v1.3.8/enterprise-financial/` — for control remediations
- Root `README.md` / `CHANGELOG.md` when user-facing

## Git and PR standards

- **Never commit directly to** `main`.
- Prefer clear conventional titles: `fix:`, `feat:`, `docs:`, `security:`.
- Include test plan for money-moving changes.

## Financial safety

All financial mutations must:

- Generate audit records.
- Generate ledger records (where applicable).
- Record actor, timestamp, reason, before/after values, and delta where relevant.
- Execute atomically inside a database transaction.
- Use existing idempotency and optimistic locking — do not introduce a second concurrency model.

## API contracts

Maintain existing frontend envelopes (`{ data: T }`). Do not break mock-compatible DTO field names or enum values without an explicit migration plan.
