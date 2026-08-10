# Phase 33 — Test Evidence Index

`*.log` files are gitignored in this repository. Captured locally during the audit:

| Local log | Result |
|-----------|--------|
| `phase33-adversarial-tests.log` | Phase 33 suite **13/13 passed** |
| `domain-test-suite.log` | Full `@wilms/domain` suite **264/264 passed** (85 files) |

## Commands

```bash
npm run test -w @wilms/domain -- src/tests/phase33
npm run test -w @wilms/domain
npm run type-check && npm run lint
npm run verify:version
npm run verify:migrations -w @wilms/domain   # journal PASS; Neon pending 0040 until applied
```

## Validation snapshot (2026-08-10)

- type-check: PASS (frontend + domain)
- lint: PASS
- verify:version: PASS (1.8.0)
- verify:migrations journal: PASS (0040 present); database watermark pending `0040` (expected until migrate)
