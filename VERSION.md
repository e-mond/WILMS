# WILMS Version

| Field | Value |
|-------|-------|
| **Current release** | `v1.3.7` |
| **Release type** | Stable |
| **Previous release** | `v1.3.7-rc3` |
| **Date** | July 2026 |

## Package versions

| Package | Version |
|---------|---------|
| `wilms` (root) | `1.3.7` |
| `@wilms/frontend` | `1.3.7` |
| `@wilms/api` | `1.3.7` |

## Promotion criteria (met for v1.3.7 stable)

1. Type-check, lint, build, and unit tests pass.
2. Production database migrations `0024` (pool loan linkage) and `0025` (allocation backfill) applied before deploy.
3. `/health` reports `schema.status: ok`.
4. Super Admin dashboard KPIs reconcile with backend transactional data and loan portfolio totals.
5. Human-readable display IDs across pools, groups, loans, expenses, and collectors in UI and exports.

## References

- [CHANGELOG.md](./CHANGELOG.md)
- [RELEASE_NOTES_v1.3.7.md](./RELEASE_NOTES_v1.3.7.md)
- [docs/financial-calculations.md](./docs/financial-calculations.md)
- [docs/version-history.md](./docs/version-history.md)
