# Operator Closure Checklist — WILMS v1.3.8

**Date:** 17 July 2026  
**Purpose:** Close **Pending** items required to upgrade certification from **⚠ READY WITH CONDITIONS** → **✅ READY FOR PRODUCTION**  
**Rule:** Attach evidence only. Mark **Pending** until artifact exists. Do not invent production evidence.

---

## How to use

1. Work top to bottom; each section maps to a gate in [FINAL_CERTIFICATION_DECISION.md](./FINAL_CERTIFICATION_DECISION.md).
2. Save evidence under `docs/certification/v1.3.8/go-live/evidence/` with timestamped filenames.
3. Update the **Status** column and link the evidence file.
4. When all items are **Done**, collect signatures in [FINAL_RELEASE_APPROVAL.md](./FINAL_RELEASE_APPROVAL.md) and update the certification decision.

---

## §1 Authenticated production smoke

**Gate:** Authenticated staging/prod money-chain smoke — currently **Pending** (`WILMS_SMOKE_*` unset in Phase 22 session).

| # | Action | Command / method | Evidence required | Status |
|---|--------|------------------|-------------------|--------|
| 1.1 | Set Railway/Vercel smoke credentials (non-demo prod user) | `WILMS_SMOKE_EMAIL`, `WILMS_SMOKE_PASSWORD` in CI or local env | Redacted env screenshot or CI secret reference | **Pending** |
| 1.2 | Run production money-chain smoke | `npm run smoke:production` (against `wilms.vercel.app`) | Log file: fee → approve → disburse → collect → reverse → expense → recon → dashboard | **Pending** |
| 1.3 | Run RBAC smoke all roles | `npm run smoke:rbac` with per-role credentials | Log showing each role pass/fail | **Pending** |
| 1.4 | Verify login / logout manually | Browser on `https://wilms.vercel.app/login` | Short screen recording or dated test log | **Pending** |
| 1.5 | Confirm demo accounts blocked on prod | Attempt `admin@wilms.demo` login | Screenshot or smoke output showing rejection | **Pending** |
| 1.6 | Password reset enumeration check | Trigger reset for known + unknown email | Log showing identical responses | **Pending** |

**Done when:** 1.2 and 1.3 logs attached with all steps green.

---

## §2 Metrics & observability

**Gate:** Authenticated RBAC/ops/metrics scrape — currently **Pending** (`WILMS_METRICS_TOKEN` unset).

| # | Action | Command / method | Evidence required | Status |
|---|--------|------------------|-------------------|--------|
| 2.1 | Set `WILMS_METRICS_TOKEN` on Railway | Railway env vars | Redacted env export | **Pending** |
| 2.2 | Curl metrics with token | `curl -H "Authorization: Bearer $TOKEN" https://wilms-production.up.railway.app/ops/metrics` | HTTP 200 + sample Prometheus text snippet | **Pending** |
| 2.3 | Configure Prometheus scrape | `prometheus.yml` target | Config file or screenshot | **Pending** |
| 2.4 | Configure external uptime probe | Uptime provider → `GET /health` | Provider dashboard screenshot | **Pending** |
| 2.5 | Verify `X-Request-Id` in app logs | Railway log search for probe request ID | Log line matching `evidence/api-response-headers.txt` ID pattern | **Pending** |

**Done when:** 2.2 returns 200 and 2.4 probe is active.

---

## §3 Environment & secrets audit

| # | Action | Evidence required | Status |
|---|--------|-------------------|--------|
| 3.1 | Export Vercel production env (redacted) | `NEXT_PUBLIC_USE_MOCK=false`, `WILMS_API_UPSTREAM`, `NEXT_PUBLIC_API_BASE_URL` | **Pending** |
| 3.2 | Export Railway production env (redacted) | DB, Cloudinary, Gmail, SMS, session secret, metrics token | **Pending** |
| 3.3 | Confirm no demo passwords in prod DB | SQL or admin UI check | **Pending** |
| 3.4 | GitHub Actions secrets audit for deploy workflow | Checklist signed by ops | **Pending** |

---

## §4 Backup, restore & migration evidence

**Gate:** Neon PITR / restore drill — currently **Pending**.

| # | Action | Evidence required | Status |
|---|--------|-------------------|--------|
| 4.1 | Confirm Neon PITR enabled + retention | Neon console screenshot | **Pending** |
| 4.2 | Record latest automated backup timestamp | Neon console or API | **Pending** |
| 4.3 | Execute restore drill (branch restore or PITR) | Step-by-step log with start/end times | **Pending** |
| 4.4 | Measure RTO | Wall clock: restore start → `GET /health` 200 | **Pending** |
| 4.5 | Post-restore migration check | `/health` → `migrations.status: ok`, watermark ≥ `0027` | **Pending** |
| 4.6 | Optional: `pg_indexes` confirm `0027` indexes | SQL output on production (read-only) | **Pending** |
| 4.7 | Attach pre-`0027` backup reference if available | Dump path or snapshot ID | **Pending** |

**Done when:** 4.1, 4.3, and 4.4 complete with RTO documented.

---

## §5 Deployment & regression

| # | Action | Evidence required | Status |
|---|--------|-------------------|--------|
| 5.1 | Link CI run for release SHA `43c1a87…` | GitHub Actions URL, all jobs green | **Pending** |
| 5.2 | E2E Playwright on release commit | `npm run test:e2e` log | **Pending** |
| 5.3 | Post-deploy `verify:deploy-sync` output | CI or manual run | **Pending** |
| 5.4 | CHANGELOG.md updated for 1.3.8 | Git diff or file link | **Pending** |

---

## §6 Formal sign-offs

| # | Role | Document | Status |
|---|------|----------|--------|
| 6.1 | Release Manager | [FINAL_RELEASE_APPROVAL.md](./FINAL_RELEASE_APPROVAL.md) | **Pending** |
| 6.2 | Security Owner | [SECURITY_SIGNOFF.md](./SECURITY_SIGNOFF.md) | **Pending** |
| 6.3 | Operations Owner | [OPERATIONS_SIGNOFF.md](./OPERATIONS_SIGNOFF.md) | **Pending** |
| 6.4 | Engineering Lead | [FINAL_RELEASE_APPROVAL.md](./FINAL_RELEASE_APPROVAL.md) | **Pending** |
| 6.5 | Product Owner | [FINAL_RELEASE_APPROVAL.md](./FINAL_RELEASE_APPROVAL.md) | **Pending** |

**Done when:** All signature blocks filled with name and date.

---

## §7 Final certification update

| # | Action | Status |
|---|--------|--------|
| 7.1 | Verify all §1–§6 items **Done** | **Pending** |
| 7.2 | Update [FINAL_CERTIFICATION_DECISION.md](./FINAL_CERTIFICATION_DECISION.md) → **✅ READY FOR PRODUCTION** | **Pending** |
| 7.3 | Update [INDEX.md](./INDEX.md) gate table | **Pending** |
| 7.4 | Communicate closure to stakeholders | **Pending** |

---

## Already complete (no operator action)

These gates passed in Phase 22 — **do not re-run unless regressing:**

| Item | Evidence |
|------|----------|
| Journal/SQL integrity (repo) | `evidence/local-gates.txt` |
| Production `/health` ok, v1.3.8 | `evidence/prod-health-20260717T170225Z.json` |
| Migration watermark `0027` | Health `latestJournalWhen: 1784296800000` |
| Migration row-count gap | **ACCEPTED** — not a blocker |
| Money-chain automated tests (local) | 36/36 in `evidence/local-gates.txt` |
| Bundle budgets | `evidence/local-gates.txt` |
| Public security headers | `evidence/api-response-headers.txt` |
| Anonymous `/ops/metrics` → 401 | `evidence/latency-samples.csv` |
| Frontend version in UI | `/login` probe |
| CSRF endpoint | `/api/auth/csrf` probe |

---

## Quick reference — env vars needed

| Variable | Purpose | Phase 22 session |
|----------|---------|------------------|
| `WILMS_SMOKE_EMAIL` | Prod smoke login | **UNSET** |
| `WILMS_SMOKE_PASSWORD` | Prod smoke login | **UNSET** |
| `WILMS_METRICS_TOKEN` | `/ops/metrics` scrape | **UNSET** |
| `DATABASE_URL` | DB dump / index queries | **UNSET** |
| `NEON_API_KEY` | Neon API backup status | **UNSET** |

---

## Closure criteria (single sentence)

**✅ READY FOR PRODUCTION** when §1–§6 are **Done** with evidence on disk and [FINAL_CERTIFICATION_DECISION.md](./FINAL_CERTIFICATION_DECISION.md) is updated — not before.
