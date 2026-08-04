# WILMS Version

| Field | Value |
|-------|-------|
| **Current release** | `v1.5.0` |
| **Release type** | Platform consolidation (full-stack Next.js on Vercel) |
| **Previous release** | `v1.4.3` |
| **Date** | August 2026 |

## Package versions

| Package | Version |
|---------|---------|
| `wilms` (root) | `1.5.0` |
| `@wilms/frontend` | `1.5.0` |
| `@wilms/domain` | `1.5.0` |
| `@wilms/api` | `1.5.0` |

## Certification status

| Field | Value |
|-------|-------|
| Verdict | **CONSOLIDATION — HUMAN CHECKPOINTS REQUIRED** |
| Production Certified | **NOT ISSUED** until Preview dual-run + cron + financial/RBAC/notification sign-off |
| Consolidation pack | [`V15_PLATFORM_CONSOLIDATION_REPORT.md`](./V15_PLATFORM_CONSOLIDATION_REPORT.md) |

## Promotion criteria

1. Type-check, lint, build, and domain/frontend tests pass.
2. Preview `/api/wilms/health` reports `1.5.0` with DB connected.
3. Financial, RBAC, and notification suites pass against Route Handlers.
4. Vercel Cron (or manual cron route) succeeds with scheduler token.
5. Redis configured on Vercel Production for rate limiting.
6. Human sign-off at final DoD checkpoint; then merge to `main`.

## References

- [V15_PLATFORM_CONSOLIDATION_REPORT.md](./V15_PLATFORM_CONSOLIDATION_REPORT.md)
- [FINAL_RELEASE_READINESS.md](./FINAL_RELEASE_READINESS.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [ARCHITECTURE_MIGRATION_REPORT.md](./ARCHITECTURE_MIGRATION_REPORT.md)
