# Production Cutover Report — WILMS v1.3.8

**Date:** 17 July 2026  
**Phase:** 23 — Production Cutover  
**Evidence session:** `20260717T193511Z`  
**Release Manager / SRE**

---

## Executive summary

WILMS v1.3.8 is **live in production** on Railway (API) and Vercel (frontend). Public probes confirm version alignment, database connectivity, integration configuration, and baseline security controls.

**Cutover decision:** **⚠ READY WITH CONDITIONS**

| Track | Status |
|-------|--------|
| Software | **CLOSED** (Phases 21–22) |
| Operator | **OPEN** |
| Production certificate | **NOT ISSUED** |

Authenticated smoke, Neon restore drill, live financial reconciliation, metrics scrape, alert delivery, and human sign-offs were **not executed** — operator credentials were **UNSET** in the Phase 23 session.

---

## Production deployment evidence

**Source:** `evidence/prod-health-20260717T193511Z.json`, `evidence/prod-health-summary.txt`

| Field | Value |
|-------|-------|
| `version` | **1.3.8** |
| `status` | **ok** |
| `gitCommit` | `866d72ed0fb417f9dd05d87956a9c564a80f9c85` (Phase 22 merge on `main`) |
| `deployedAt` | `2026-07-17T19:12:38.100Z` |
| `buildId` | `14bae007-c667-41b9-b59a-59784dd1b75f` |
| `environment` | `production` |
| `nodeVersion` | `v20.20.2` |
| `uptimeSeconds` | `1353` (at probe time) |

### Database & schema

| Field | Value | Assessment |
|-------|-------|------------|
| `database.configured` | `true` | **Complete** |
| `database.connected` | `true` | **Complete** |
| `database.status` | `connected` | **Complete** |
| `schema.status` | `ok` | **Complete** |
| `schema.missingTables` | `[]` | **Complete** |

### Migrations

| Field | Value | Assessment |
|-------|-------|------------|
| `migrations.expected` | `28` | — |
| `migrations.applied` | `27` | **ACCEPTED** row-count gap |
| `migrations.status` | `ok` | **Complete** |
| `migrations.countGap` | `true` | **ACCEPTED** — historical; watermark current |
| `migrations.latestJournalWhen` | `1784296800000` | **Complete** — watermark = `0027` |
| `migrations.latestAppliedAt` | `2026-07-17T14:00:00.000Z` | — |

### Integrations

| Integration | Provider | Configured | Assessment |
|-------------|----------|------------|------------|
| Uploads | Cloudinary | `valid: true` | **Complete** |
| Mail | Gmail | `true` | **Complete** |
| SMS | smsnotifygh | `true` | **Complete** |
| Notifications in-app | — | `available` | **Complete** |

### Workers (accepted residual)

| Component | Value | Note |
|-----------|-------|------|
| `workers.redis` | `not_used` | Documented v1.3.8 posture |
| `workers.queue` | `in_process` | Restart clears in-flight jobs |
| `workers.scheduler` | `http_triggered` | External cron required |

---

## Public endpoint probes

**Source:** `evidence/public-probes-20260717T193511Z.csv`

| Check | URL | HTTP | Latency (s) | Result |
|-------|-----|------|-------------|--------|
| API health | `https://wilms-production.up.railway.app/health` | 200 | ~0.31 | **Complete** |
| Ops metrics (anon) | `…/ops/metrics` | 401 | ~0.11 | **Complete** — auth enforced |
| Frontend login | `https://wilms.vercel.app/login` | 200 | ~0.20 | **Complete** — contains `1.3.8` |
| CSRF | `…/api/auth/csrf` | 200 | ~0.17 | **Complete** |
| Ops UI | `…/ops` | 307 | ~0.07 | **Complete** — auth redirect |

**Frontend version evidence:** `evidence/frontend-version-20260717T193511Z.txt` → `1.3.8`

---

## Credential audit

**Source:** `evidence/credential-audit-20260717T193511Z.txt`

| Variable | Status | Impact |
|----------|--------|--------|
| `DATABASE_URL` | **UNSET** | No live financial reconcile / `pg_dump` |
| `WILMS_SMOKE_EMAIL` | **UNSET** | No authenticated smoke |
| `WILMS_SMOKE_PASSWORD` | **UNSET** | No authenticated smoke |
| `WILMS_METRICS_TOKEN` | **UNSET** | No metrics scrape |
| `NEON_API_KEY` | **UNSET** | No Neon API backup status |
| `RAILWAY_TOKEN` | **UNSET** | No Railway console automation |
| `VERCEL_TOKEN` | **UNSET** | No Vercel env export |

---

## Blocked execution (by design)

| Action | Result | Evidence |
|--------|--------|----------|
| `npm run smoke:production` | **Failed** — credentials required | `evidence/smoke-no-creds-20260717T193511Z.log` |
| Neon restore drill | **Not executed** | No console/API access |
| Financial DB reconcile | **Not executed** | `DATABASE_URL` unset |
| Human signatures | **Not collected** | Cannot fabricate |

---

## Gate table (authoritative)

| Gate | Status | Evidence |
|------|--------|----------|
| Software track (Phases 21–22) | **CLOSED** | Upstream packs |
| Production version 1.3.8 deployed | **Complete** | `prod-health-*.json` |
| Public health / integrations | **Complete** | `prod-health-*.json`, probes CSV |
| Security headers (HSTS, CSP, CORS, X-Request-Id) | **Complete** | `api-headers-*.txt` |
| Anonymous `/ops/metrics` → 401 | **Complete** | probes CSV |
| Migration watermark `0027` | **Complete** | health JSON |
| Migration countGap 27/28 | **ACCEPTED** | health JSON |
| Authenticated money-chain smoke | **Pending** | smoke log (blocked) |
| RBAC role smokes | **Pending** | — |
| Live financial DB reconcile | **Pending** | — |
| Neon backup / restore / PITR | **Pending** | — |
| Metrics scrape with token | **Pending** | — |
| Alert delivery | **Pending** | — |
| Human sign-offs | **Pending** | — |
| Tag `v1.3.8-production-certified` | **NOT CREATED** | — |
| Maintenance branch | **NOT CREATED** | [MAINTENANCE_BRANCH_PLAN.md](./MAINTENANCE_BRANCH_PLAN.md) |

---

## Cutover decision

# ⚠ READY WITH CONDITIONS

Production cutover **software objectives are met.** Operator-track closure is required before issuing the production certificate and creating the certified tag / maintenance branch.

### Path to ✅ WILMS v1.3.8 Production Certified

1. Complete every **Pending** row in [PRODUCTION_ACCEPTANCE_CHECKLIST.md](./PRODUCTION_ACCEPTANCE_CHECKLIST.md) with timestamped evidence.
2. Collect human signatures in [RELEASE_APPROVAL_RECORD.md](./RELEASE_APPROVAL_RECORD.md) and related sign-off documents.
3. Update [FINAL_PRODUCTION_CERTIFICATE.md](./FINAL_PRODUCTION_CERTIFICATE.md) to **ISSUED**.
4. Execute [MAINTENANCE_BRANCH_PLAN.md](./MAINTENANCE_BRANCH_PLAN.md) — tag `v1.3.8-production-certified` and maintenance branch **only after** full certification.

---

## Related documents

- [LIVE_SMOKE_TEST_RESULTS.md](./LIVE_SMOKE_TEST_RESULTS.md)
- [PRODUCTION_FINANCIAL_VALIDATION.md](./PRODUCTION_FINANCIAL_VALIDATION.md)
- [BACKUP_RESTORE_EVIDENCE.md](./BACKUP_RESTORE_EVIDENCE.md)
- [FINAL_PRODUCTION_CERTIFICATE.md](./FINAL_PRODUCTION_CERTIFICATE.md)
