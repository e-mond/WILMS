# WILMS Version

| Field | Value |
|-------|-------|
| **Current release** | `v1.4.2` |
| **Release type** | Phase 27 residual Medium closure / certification evidence pass |
| **Previous release** | `v1.4.1` |
| **Date** | July 2026 |

## Package versions

| Package | Version |
|---------|---------|
| `wilms` (root) | `1.4.2` |
| `@wilms/frontend` | `1.4.2` |
| `@wilms/api` | `1.4.2` |

## Certification status

| Field | Value |
|-------|-------|
| Verdict | **READY WITH CONDITIONS** |
| Production Certified | **NOT ISSUED** |
| Primary pack | [`docs/certification/v1.4/phase-27/`](./docs/certification/v1.4/phase-27/FINAL_PRODUCTION_CERTIFICATION.md) |

## Promotion criteria (toward Production Certified)

1. Type-check, lint, build, and unit tests pass.
2. Phase 27 code remediations merged (invite tokens, expense SoD, SQL report scoping, API rate limit).
3. Migration `0029_v141_invitation_tokens` applied on target environments.
4. Authenticated staging smoke + RBAC smoke with live non-demo credentials.
5. Backup/restore drill evidence with RTO/RPO.
6. Operator sign-off on residual dependency CVEs and demo purge.

## References

- [docs/FINAL_AUDIT_INDEX.md](./docs/FINAL_AUDIT_INDEX.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [PROJECT_STATUS.md](./PROJECT_STATUS.md)
