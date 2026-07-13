# WILMS Version

| Field | Value |
|-------|-------|
| **Current release** | `v1.3.7-rc2` |
| **Release type** | Release Candidate (stability & business logic) |
| **Target stable** | `v1.3.7` |
| **Previous release** | `v1.3.6-rc1` |
| **Date** | July 2026 |

## Package versions

| Package | Version |
|---------|---------|
| `wilms` (root) | `1.3.7-rc2` |
| `@wilms/frontend` | `1.3.7-rc2` |
| `@wilms/api` | `1.3.7-rc2` |

## Promotion criteria (v1.3.7 stable)

1. All verification gates pass (type-check, lint, build, unit tests, E2E, bundle budget).
2. Production database migrations applied (`0020` `organization_holidays` minimum).
3. `/health` reports `schema.status: ok`.
4. Collector admin-fee workflow smoke-tested end-to-end.
5. Super Admin dashboard KPIs reconcile with backend transactional data.

## References

- [CHANGELOG.md](./CHANGELOG.md)
- [RELEASE_NOTES_v1.3.7.md](./RELEASE_NOTES_v1.3.7.md)
- [docs/version-history.md](./docs/version-history.md)
