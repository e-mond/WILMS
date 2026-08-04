# WILMS Version

| Field | Value |
|-------|-------|
| **Current release** | `v1.4.3` |
| **Release type** | Critical financial workflow hotfix |
| **Previous release** | `v1.4.2` |
| **Date** | August 2026 |

## Package versions

| Package | Version |
|---------|---------|
| `wilms` (root) | `1.4.3` |
| `@wilms/frontend` | `1.4.3` |
| `@wilms/api` | `1.4.3` |

## Certification status

| Field | Value |
|-------|-------|
| Verdict | **HOTFIX VALIDATION REQUIRED** |
| Production Certified | **NOT ISSUED** (inherits v1.4.2 conditions) |
| Hotfix pack | [`V1.4.3_HOTFIX_REPORT.md`](./V1.4.3_HOTFIX_REPORT.md) |

## Promotion criteria

1. Type-check, lint, build, and unit tests pass.
2. Financial workflow paths verified: admin fee → approve → disburse; reconciliation submit; review group display.
3. Idempotency-Key present on browser money POSTs under production flags.
4. No Critical/High regressions.

## References

- [V1.4.3_HOTFIX_REPORT.md](./V1.4.3_HOTFIX_REPORT.md)
- [RELEASE_NOTES_v1.4.3.md](./RELEASE_NOTES_v1.4.3.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [FINANCIAL_WORKFLOW_FIXES.md](./FINANCIAL_WORKFLOW_FIXES.md)
