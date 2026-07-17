# WILMS Version

| Field | Value |
|-------|-------|
| **Current release** | `v1.3.8` |
| **Release type** | Final Hardening / Certification candidate |
| **Previous release** | `v1.3.7` |
| **Date** | July 2026 |

## Package versions

| Package | Version |
|---------|---------|
| `wilms` (root) | `1.3.8` |
| `@wilms/frontend` | `1.3.8` |
| `@wilms/api` | `1.3.8` |

## Promotion criteria (v1.3.8)

1. Type-check, lint, build, and unit tests pass.
2. Critical and high security findings from certification audit resolved or documented as external blockers.
3. `/health` reports `status: ok`, `schema.status: ok`, `migrations.status: ok`.
4. Production smoke + RBAC smoke with live credentials.
5. Toast dedupe, skeleton loading, guided tour, and permission overrides from hardening sprint.

## References

- [FINAL_HARDENING_REPORT.md](./FINAL_HARDENING_REPORT.md)
- [FINAL_RELEASE_READINESS_v1.3.8.md](./FINAL_RELEASE_READINESS_v1.3.8.md)
- [FINAL_PRODUCTION_CERTIFICATION.md](./FINAL_PRODUCTION_CERTIFICATION.md)
- [CHANGELOG.md](./CHANGELOG.md)
