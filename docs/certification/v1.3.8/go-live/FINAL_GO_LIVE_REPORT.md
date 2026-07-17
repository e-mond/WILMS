# Final Go-Live Report — WILMS v1.3.8

**Date:** 17 July 2026  
**Release:** v1.3.8  
**Evidence session:** Agent environment + public production probes  
**Author posture:** Release Manager / SRE

---

## Executive summary

WILMS v1.3.8 is **deployed and serving** on production infrastructure. Public probes confirm API health, schema integrity, integration configuration, frontend version alignment, and security header presence. Local release gates (migrations journal, type-check, targeted API tests, version consistency, bundle budgets, mock-guard) all passed in the agent environment.

**Certification decision: ⚠ READY WITH CONDITIONS**

| Dimension | Verdict |
|-----------|---------|
| Software readiness | **CLOSED** |
| Operator readiness | **OPEN** (see conditions below) |

---

## Production endpoints (validated this session)

| Endpoint | Result | Evidence |
|----------|--------|----------|
| `GET https://wilms-production.up.railway.app/health` | HTTP 200, `version: 1.3.8`, `status: ok` | `evidence/prod-health-20260717T170225Z.json` |
| `GET https://wilms.vercel.app/login` | HTTP 200, body contains `1.3.8` | Probe 2026-07-17 |
| `GET https://wilms.vercel.app/api/auth/csrf` | HTTP 200 `{"ok":true}` | Probe 2026-07-17 |
| `GET /ops/metrics` (anonymous) | HTTP 401 | `evidence/latency-samples.csv` |

---

## Local gates (agent environment 2026-07-17)

| Gate | Result | Notes |
|------|--------|-------|
| `npm run verify:migrations` | **PASS** | Journal 28/28; sequential idx; no orphan/missing SQL; last tag `0027_hot_query_indexes`. DB step skipped (`DATABASE_URL` unset). |
| `npm run type-check` | **PASS** | Monorepo |
| Targeted API tests (enterprise/financial/security/recon/ops/health/transactions) | **PASS** | 36/36 |
| `npm run verify:version` | **PASS** | All packages 1.3.8 |
| `npm run bundle:budget-check` | **PASS** | JS gzip 168.4 KB / CSS 9.4 KB (budgets 350/100) |
| `verify:mock-guard` + API path integrity | **PASS** | 0 missing backend routes for FE apiClient |

Source: `evidence/local-gates.txt`

---

## Production health snapshot

Captured `2026-07-17T17:02:25.610Z` from Railway:

| Field | Value |
|-------|-------|
| `status` | `ok` |
| `degradedReasons` | `[]` |
| `version` | `1.3.8` |
| `gitCommit` | `43c1a87aa223c32daab683b983b4b33ba86d301e` (Phase 20 merge; Phase 21 docs-only) |
| `database.connected` | `true` |
| `migrations.expected` | 28 |
| `migrations.applied` | 27 |
| `migrations.status` | `ok` |
| `migrations.countGap` | `true` (accepted — see MIGRATION_VERIFICATION.md) |
| `migrations.latestAppliedAt` | `2026-07-17T14:00:00.000Z` |
| `migrations.latestJournalWhen` | `1784296800000` (= `0027` watermark) |
| `schema.status` | `ok` |
| `uploads` | Cloudinary valid |
| `integrations.mail` | Gmail configured |
| `integrations.sms` | smsnotifygh configured |
| `workers.redis` | `not_used` |
| `workers.queue` | `in_process` |
| `workers.scheduler` | `http_triggered` |

---

## Gate rollup

| Gate | Status |
|------|--------|
| Journal/SQL integrity (repo) | **PASS** |
| Production migration watermark includes 0027 | **PASS** |
| Migration row-count gap (27 vs 28) | **ACCEPTED** |
| Money-chain automated tests | **PASS** |
| Authenticated staging/prod money-chain smoke | **Pending** |
| Neon PITR / restore drill | **Pending** |
| Public prod health/version/integrations | **PASS** |
| Authenticated RBAC/ops/metrics scrape with token | **Pending** |
| Backup restore RTO measured | **Pending** |
| Operator sign-off signatures | **Pending** |

---

## Software readiness — CLOSED

Evidence supports:

1. **Code quality gates green** — type-check, 36/36 targeted API tests, version 1.3.8 aligned, bundle within budget, no mock leakage or API path gaps.
2. **Production serving v1.3.8** — health, login page, and CSRF endpoint respond correctly.
3. **Database connected, schema ok** — no missing tables reported.
4. **Integrations configured** — Cloudinary, Gmail, SMS per health payload.
5. **No Critical software defects identified in Phase 22** — automated money-chain suite passed locally; public probes show operational API.

Residual software limitations (documented upstream, not blockers for this gate):

- In-process queue (`workers.queue: in_process`)
- Redis not used (`workers.redis: not_used`)
- HTTP-triggered scheduler

---

## Operator readiness — OPEN conditions

The following require operator action and **attached evidence** before upgrading to **✅ READY FOR PRODUCTION**:

| # | Condition | Status |
|---|-----------|--------|
| 1 | Authenticated production money-chain smoke (`WILMS_SMOKE_*`) | **Pending** |
| 2 | Authenticated RBAC smoke across roles | **Pending** |
| 3 | `/ops/metrics` scrape with `WILMS_METRICS_TOKEN` | **Pending** |
| 4 | Neon PITR enabled + restore drill with RTO log | **Pending** |
| 5 | Formal operator sign-offs (security, ops, release) | **Pending** |

See [OPERATOR_CLOSURE_CHECKLIST.md](./OPERATOR_CLOSURE_CHECKLIST.md).

---

## Environment variables (agent session)

The following were **UNSET** in the agent environment — no authenticated prod probes were possible:

- `DATABASE_URL`
- `WILMS_SMOKE_*`
- `WILMS_METRICS_TOKEN`
- `NEON_API_KEY`

---

## What WILMS v1.3.8 is (and is not)

**In scope:** Interest-free field lending and collections platform for staff roles (Super Admin, Registration Officer, Approver, Collector, Auditor).

**Out of scope for this certification:**

- Statutory general ledger / banking core
- Fortune-500 acquisition-grade posture
- Proven 100k+ row scale without load testing

---

## Related documents

- [FINAL_CERTIFICATION_DECISION.md](./FINAL_CERTIFICATION_DECISION.md) — formal verdict
- [OPERATOR_CLOSURE_CHECKLIST.md](./OPERATOR_CLOSURE_CHECKLIST.md) — remaining actions
- [PRODUCTION_VALIDATION_REPORT.md](./PRODUCTION_VALIDATION_REPORT.md) — endpoint detail
