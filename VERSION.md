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
| Consolidation pack | [`docs/v1.5/V15_PLATFORM_CONSOLIDATION_REPORT.md`](docs/v1.5/V15_PLATFORM_CONSOLIDATION_REPORT.md) |
| Documentation overhaul | [`DOCUMENTATION_REPORT.md`](DOCUMENTATION_REPORT.md) |

## Promotion criteria

1. Type-check, lint, build, and domain/frontend tests pass.
2. Preview `/api/wilms/health` reports `1.5.0` with DB connected.
3. Financial, RBAC, and notification suites pass against Route Handlers.
4. Vercel Cron (or manual cron route) succeeds with scheduler token.
5. Redis configured on Vercel Production for rate limiting.
6. Human sign-off at final DoD checkpoint.

## References

- [docs/v1.5/](docs/v1.5/)
- [CHANGELOG.md](CHANGELOG.md)
- [docs/deployment-guide.md](docs/deployment-guide.md)
