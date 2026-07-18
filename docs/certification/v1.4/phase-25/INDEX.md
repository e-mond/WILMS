# Phase 25 — v1.4.0 Platform Foundation Certification Index

**Release:** WILMS **1.4.0** (platform foundation)  
**Certification date:** 18 July 2026  
**Scope:** Software foundation for merge to `main` — **not** production deployment certification  
**Evidence folder:** [`evidence/`](./evidence/)

---

## Executive summary

Phase 25 delivers the v1.4.0 platform baseline: Node 22 standardization, optional Redis/BullMQ with in-process fallback, idempotency hardening, cursor pagination (borrowers), transactional outbox schema, feature flags, extended ops/Prometheus metrics, and CI verification gates.

| Gate | Baseline (v1.3.8) | Post-impl (v1.4.0) |
|------|-------------------|---------------------|
| `npm run type-check` | PASS | PASS |
| `npm run lint` | PASS | PASS |
| API tests (`@wilms/api`) | 150/150 (43 files) | **158/158 (47 files)** |
| `verify:migrations` | 28 entries → `0027` | **29 entries → `0028_v140_platform_foundation`** |
| `verify:version` | 1.3.8 | **1.4.0** |
| `verify:node` | — | **PASS** (runtime 22.14.0) |
| `drill:backup-restore` | — | **SKIPPED** (no DB URLs) |

**Recommendation:** Phase 25 software foundation is **COMPLETE** for merge to `main` as the v1.4.0 platform baseline. Operator actions (Redis provision, Neon restore drill, production deploy of 1.4.0) remain **next**. Do **not** start Phase 26 without approval. Do **not** claim production certified.

---

## Document catalog

| # | Document | Purpose |
|---|----------|---------|
| 1 | [V1.4_PHASE_25_BASELINE.md](./V1.4_PHASE_25_BASELINE.md) | Pre/post implementation gate comparison |
| 2 | [V1.4_NODE22_MIGRATION_REPORT.md](./V1.4_NODE22_MIGRATION_REPORT.md) | Node 22 standardization evidence |
| 3 | [V1.4_BULLMQ_IMPLEMENTATION.md](./V1.4_BULLMQ_IMPLEMENTATION.md) | Durable queue layer design and verification |
| 4 | [V1.4_IDEMPOTENCY_REPORT.md](./V1.4_IDEMPOTENCY_REPORT.md) | Money API idempotency hardening |
| 5 | [V1.4_CURSOR_PAGINATION_REPORT.md](./V1.4_CURSOR_PAGINATION_REPORT.md) | Keyset pagination helpers and borrowers API |
| 6 | [V1.4_OBSERVABILITY_REPORT.md](./V1.4_OBSERVABILITY_REPORT.md) | Tracing, request IDs, Prometheus extensions |
| 7 | [V1.4_OUTBOX_DESIGN.md](./V1.4_OUTBOX_DESIGN.md) | Transactional outbox schema and delivery |
| 8 | [V1.4_FEATURE_FLAGS_REPORT.md](./V1.4_FEATURE_FLAGS_REPORT.md) | `WILMS_FLAG_*` configuration surface |
| 9 | [V1.4_BACKUP_RESTORE_REPORT.md](./V1.4_BACKUP_RESTORE_REPORT.md) | Restore drill script and SKIPPED evidence |
| 10 | [V1.4_CI_CD_REPORT.md](./V1.4_CI_CD_REPORT.md) | CI gate additions for v1.4 |
| 11 | [V1.4_SECURITY_REVIEW.md](./V1.4_SECURITY_REVIEW.md) | Security posture for new platform surfaces |
| 12 | [V1.4_PERFORMANCE_REPORT.md](./V1.4_PERFORMANCE_REPORT.md) | Pagination/index impact; load gaps |
| 13 | [V1.4_DOCUMENTATION_AUDIT.md](./V1.4_DOCUMENTATION_AUDIT.md) | Doc inventory and gaps |
| 14 | [V1.4_PHASE_25_FINAL_REPORT.md](./V1.4_PHASE_25_FINAL_REPORT.md) | Final certification decision |

---

## Verified vs blocked (operator)

### Verified (local / CI software gates)

- Type-check, lint, API unit tests (158/158)
- Migration journal integrity (29 entries)
- Version consistency (1.4.0 across packages)
- Node 22 consistency (`verify:node`)
- In-process queue fallback unit tests
- Platform tests: cursor pagination, idempotency hash, feature flags
- CI workflow includes new verify steps

### Blocked / not verified (requires operator environment)

| Item | Status | Notes |
|------|--------|-------|
| Redis in staging/production | **Not verified** | `REDIS_URL` not exercised in this certification run |
| BullMQ under load | **Not verified** | No soak/chaos test with live Redis |
| Neon restore drill PASSED | **SKIPPED** | No `WILMS_BACKUP_DATABASE_URL` / `WILMS_RESTORE_DATABASE_URL` |
| Production deploy of 1.4.0 | **Not done** | v1.3.8 remains live per prior cutover |
| Authenticated production smoke | **Not run** | Requires live credentials |
| OpenTelemetry collector export | **Not implemented** | Span logs only; no OTLP exporter |

---

## Related artifacts

- [`CHANGELOG.md`](../../../CHANGELOG.md) — `[1.4.0]` entry
- [`docs/planning/v1.4/`](../../planning/v1.4/) — roadmap and objectives
- [`evidence/local-gates.txt`](./evidence/local-gates.txt) — post-impl gate summary
- [`evidence/baseline-gates.log`](./evidence/baseline-gates.log) — pre-impl capture
- [`evidence/backup-restore-drill-2026-07-18T09-51-45-068Z.json`](./evidence/backup-restore-drill-2026-07-18T09-51-45-068Z.json) — SKIPPED drill evidence
