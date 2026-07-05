# Contributing to WILMS

Thank you for contributing to the WILMS financial platform. This document defines the standards required for all P14.3B and subsequent work.

## Development workflow

1. Branch from the current release line (`release/p14.3a` or active phase branch).
2. Implement with validation gates after each major block.
3. Update documentation before opening a PR.
4. Push, open PR, apply labels, assign milestone.

See [docs/engineering/branching-strategy.md](docs/engineering/branching-strategy.md) for branch naming and merge policy.

## Code quality

Every new backend file must include:

- **File header** — module purpose and phase reference.
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
npm run perf:baseline -w @wilms/api
```

If any gate fails: stop, fix, re-run, then continue.

## Documentation

After every phase, update:

- `README.md` — current phase, domain coverage, production readiness, validation status.
- `docs/releases/P14.3B-Phase-X.md` — features, validation, known issues, next phase.
- `docs/archive/page-validation/` — certification, implementation reports, git reports.

## Git and PR standards

- **Never commit directly to** `main` or `release/p14.3a`.
- **PR title:** `[P14.3B-Phase-X] <phase title>`
- **Labels:** `enhancement`, `backend`, `financial`, `phase-x`, `documentation` (+ `performance`, `security`, `database` when applicable).
- **Milestone:** `P14.3B Financial Controls`

## Financial safety

All financial mutations must:

- Generate audit records.
- Generate ledger records (where applicable).
- Record actor, timestamp, reason, before/after values, and delta.
- Execute atomically inside a database transaction.
- Use P14.3A idempotency and optimistic locking — do not introduce a second concurrency model.

## API contracts

Maintain existing frontend envelopes (`{ data: T }`). Do not break mock-compatible DTO field names or enum values without an explicit migration plan.
