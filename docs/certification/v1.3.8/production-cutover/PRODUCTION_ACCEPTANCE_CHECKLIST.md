# Production Acceptance Checklist — WILMS v1.3.8

**Date:** 17 July 2026  
**Phase:** 23 — Production Cutover  
**Rule:** Mark **Complete** only with on-disk evidence. Unknown or not executed = **Pending**.  
**Columns:** Status | Evidence | Owner | Timestamp | Notes

---

## §1 Deploy & version sync

| Item | Status | Evidence | Owner | Timestamp | Notes |
|------|--------|----------|-------|-----------|-------|
| API `/health` returns 200 `status: ok` | **Complete** | `evidence/prod-health-20260717T193511Z.json` | SRE | 2026-07-17T19:35:11Z | — |
| API `version` = `1.3.8` | **Complete** | `evidence/prod-health-20260717T193511Z.json` | SRE | 2026-07-17T19:35:11Z | — |
| API `gitCommit` = Phase 22 merge SHA | **Complete** | `866d72ed0fb417f9dd05d87956a9c564a80f9c85` | SRE | 2026-07-17T19:35:11Z | — |
| API `deployedAt` recorded | **Complete** | `2026-07-17T19:12:38.100Z` | SRE | 2026-07-17T19:35:11Z | — |
| API `buildId` recorded | **Complete** | `14bae007-c667-41b9-b59a-59784dd1b75f` | SRE | 2026-07-17T19:35:11Z | — |
| Frontend `/login` contains `1.3.8` | **Complete** | `evidence/frontend-version-20260717T193511Z.txt` | SRE | 2026-07-17T19:35:13Z | — |
| CI green for release SHA | **Pending** | — | Engineering | — | GitHub Actions URL required |

---

## §2 Database & migrations

| Item | Status | Evidence | Owner | Timestamp | Notes |
|------|--------|----------|-------|-----------|-------|
| Database connected | **Complete** | `evidence/prod-health-20260717T193511Z.json` | SRE | 2026-07-17T19:35:11Z | — |
| Schema `status: ok`, no missing tables | **Complete** | health JSON `schema` | SRE | 2026-07-17T19:35:11Z | — |
| Migration watermark includes `0027` | **Complete** | `latestJournalWhen: 1784296800000` | SRE | 2026-07-17T19:35:11Z | — |
| Migration `status: ok` | **Complete** | health JSON `migrations` | SRE | 2026-07-17T19:35:11Z | — |
| Migration countGap 27/28 | **Complete** | **ACCEPTED** — historical gap | Release Manager | 2026-07-17T19:35:11Z | Not a blocker |
| `0027` index verification (`pg_indexes`) | **Pending** | — | DBA | — | Requires `DATABASE_URL` |
| Pre-migration backup / snapshot ID | **Pending** | — | DBA | — | — |

---

## §3 Integrations

| Item | Status | Evidence | Owner | Timestamp | Notes |
|------|--------|----------|-------|-----------|-------|
| Cloudinary uploads valid | **Complete** | health JSON `uploads` | SRE | 2026-07-17T19:35:11Z | — |
| Gmail mail configured | **Complete** | health JSON `integrations.mail` | SRE | 2026-07-17T19:35:11Z | — |
| smsnotifygh SMS configured | **Complete** | health JSON `integrations.sms` | SRE | 2026-07-17T19:35:11Z | — |
| Live email delivery test | **Pending** | — | Ops | — | — |
| Live SMS delivery test | **Pending** | — | Ops | — | — |

---

## §4 Security (public layer)

| Item | Status | Evidence | Owner | Timestamp | Notes |
|------|--------|----------|-------|-----------|-------|
| API HSTS header | **Complete** | `evidence/api-headers-20260717T193511Z.txt` | Security | 2026-07-17T19:35:13Z | — |
| API CSP header | **Complete** | `evidence/api-headers-20260717T193511Z.txt` | Security | 2026-07-17T19:35:13Z | — |
| CORS → `https://wilms.vercel.app` | **Complete** | `evidence/api-headers-20260717T193511Z.txt` | Security | 2026-07-17T19:35:13Z | — |
| `X-Request-Id` present | **Complete** | `evidence/api-headers-20260717T193511Z.txt` | Security | 2026-07-17T19:35:13Z | — |
| Frontend HSTS + preload | **Complete** | `evidence/frontend-headers-20260717T193511Z.txt` | Security | 2026-07-17T19:35:13Z | — |
| Anonymous `/ops/metrics` → 401 | **Complete** | `evidence/public-probes-20260717T193511Z.csv` | Security | 2026-07-17T19:35:13Z | ~0.11s |
| `/ops` UI auth redirect (307) | **Complete** | `evidence/public-probes-20260717T193511Z.csv` | Security | 2026-07-17T19:35:13Z | — |
| CSRF endpoint 200 | **Complete** | `evidence/public-probes-20260717T193511Z.csv` | Security | 2026-07-17T19:35:13Z | — |
| Production env secrets audit | **Pending** | — | Security | — | Redacted Railway/Vercel export |
| RBAC prod smoke all roles | **Pending** | — | Security / QA | — | `smoke:rbac` |
| Demo accounts blocked on prod | **Pending** | — | Security | — | — |

---

## §5 Authenticated smoke & workflows

| Item | Status | Evidence | Owner | Timestamp | Notes |
|------|--------|----------|-------|-----------|-------|
| `WILMS_SMOKE_*` credentials provisioned | **Pending** | `evidence/credential-audit-20260717T193511Z.txt` | Ops | 2026-07-17T19:35:11Z | UNSET |
| `npm run smoke:production` all green | **Pending** | `evidence/smoke-no-creds-20260717T193511Z.log` | QA | 2026-07-17T19:35:11Z | Failed as designed |
| Money-chain: fee → approve → disburse | **Pending** | — | QA | — | — |
| Money-chain: collect → reverse | **Pending** | — | QA | — | — |
| Money-chain: expense → recon → dashboard | **Pending** | — | QA | — | — |
| Manual login / logout browser test | **Pending** | — | QA | — | — |
| Password reset enumeration check | **Pending** | — | Security | — | — |

---

## §6 Financial validation (live)

| Item | Status | Evidence | Owner | Timestamp | Notes |
|------|--------|----------|-------|-----------|-------|
| `DATABASE_URL` available for read-only reconcile | **Pending** | `evidence/credential-audit-20260717T193511Z.txt` | Finance | 2026-07-17T19:35:11Z | UNSET |
| `verify:financial` against production | **Pending** | — | Finance | — | — |
| Balance derivation spot-check | **Pending** | — | Finance | — | — |
| No orphan obligations | **Pending** | — | Finance | — | — |
| Finance sign-off | **Pending** | [RELEASE_APPROVAL_RECORD.md](./RELEASE_APPROVAL_RECORD.md) | Finance | — | — |

---

## §7 Backup, restore & DR

| Item | Status | Evidence | Owner | Timestamp | Notes |
|------|--------|----------|-------|-----------|-------|
| Neon PITR enabled + retention | **Pending** | — | DBA / Ops | — | — |
| Latest backup timestamp recorded | **Pending** | — | DBA / Ops | — | `NEON_API_KEY` unset |
| Restore drill executed | **Pending** | — | DBA / Ops | — | NOT EXECUTED |
| RTO measured | **Pending** | — | SRE | — | — |
| Post-restore health + watermark | **Pending** | — | SRE | — | — |

---

## §8 Observability & alerts

| Item | Status | Evidence | Owner | Timestamp | Notes |
|------|--------|----------|-------|-----------|-------|
| `WILMS_METRICS_TOKEN` set on Railway | **Pending** | `evidence/credential-audit-20260717T193511Z.txt` | Ops | 2026-07-17T19:35:11Z | UNSET |
| `/ops/metrics` scrape 200 with token | **Pending** | — | SRE | — | — |
| External uptime probe on `/health` | **Pending** | — | SRE | — | — |
| Prometheus / Grafana configured | **Pending** | — | SRE | — | — |
| Alert delivery test (pager/email) | **Pending** | — | SRE | — | — |
| Request ID log correlation | **Pending** | — | SRE | — | — |

---

## §9 Performance (baseline)

| Item | Status | Evidence | Owner | Timestamp | Notes |
|------|--------|----------|-------|-----------|-------|
| `/health` latency sample | **Complete** | `evidence/public-probes-20260717T193511Z.csv` | SRE | 2026-07-17T19:35:13Z | ~0.31s |
| `/login` latency sample | **Complete** | probes CSV | SRE | 2026-07-17T19:35:13Z | ~0.20s |
| Load / concurrency test | **Pending** | — | Engineering | — | Not in Phase 23 scope |

---

## §10 Software track (prior phases — closed)

| Item | Status | Evidence | Owner | Timestamp | Notes |
|------|--------|----------|-------|-----------|-------|
| Product acceptance (Phase 21) | **Complete** | `docs/certification/v1.3.8/product-acceptance/` | Product | Phase 21 | Software track |
| Go-live closure (Phase 22) | **Complete** | `docs/certification/v1.3.8/go-live/` | Release Manager | Phase 22 | Software track |
| Money-chain unit tests | **Complete** | Phase 22 `local-gates.txt` | Engineering | Phase 22 | 36/36 subset |
| Bundle budgets | **Complete** | Phase 22 evidence | Engineering | Phase 22 | — |

---

## §11 Human sign-offs

| Item | Status | Evidence | Owner | Timestamp | Notes |
|------|--------|----------|-------|-----------|-------|
| Engineering Lead | **Pending** | [RELEASE_APPROVAL_RECORD.md](./RELEASE_APPROVAL_RECORD.md) | Engineering Lead | — | — |
| CTO | **Pending** | [RELEASE_APPROVAL_RECORD.md](./RELEASE_APPROVAL_RECORD.md) | CTO | — | — |
| Operations | **Pending** | [OPERATIONS_SIGNOFF.md](./OPERATIONS_SIGNOFF.md) | Operations | — | — |
| Finance | **Pending** | [RELEASE_APPROVAL_RECORD.md](./RELEASE_APPROVAL_RECORD.md) | Finance | — | — |
| Security | **Pending** | [SECURITY_OPERATIONAL_SIGNOFF.md](./SECURITY_OPERATIONAL_SIGNOFF.md) | Security | — | — |
| Product Owner | **Pending** | [RELEASE_APPROVAL_RECORD.md](./RELEASE_APPROVAL_RECORD.md) | Product Owner | — | — |
| Support | **Pending** | [RELEASE_APPROVAL_RECORD.md](./RELEASE_APPROVAL_RECORD.md) | Support | — | — |
| QA | **Pending** | [RELEASE_APPROVAL_RECORD.md](./RELEASE_APPROVAL_RECORD.md) | QA | — | — |
| Release Manager | **Pending** | [RELEASE_APPROVAL_RECORD.md](./RELEASE_APPROVAL_RECORD.md) | Release Manager | — | Doc session only |

---

## §12 Certification artifacts

| Item | Status | Evidence | Owner | Timestamp | Notes |
|------|--------|----------|-------|-----------|-------|
| Production certificate issued | **Pending** | [FINAL_PRODUCTION_CERTIFICATE.md](./FINAL_PRODUCTION_CERTIFICATE.md) | Release Manager | — | **NOT ISSUED** |
| Tag `v1.3.8-production-certified` | **Pending** | — | Release Manager | — | **NOT CREATED** |
| Maintenance branch | **Pending** | [MAINTENANCE_BRANCH_PLAN.md](./MAINTENANCE_BRANCH_PLAN.md) | Release Manager | — | Post-certification only |

---

## Rollup

| Track | Open items | Status |
|-------|------------|--------|
| Public probes / software-closed | 0 blockers | **Complete** |
| Operator track | Smoke, financial, backup, metrics, alerts, signatures | **Pending** |
| **Cutover decision** | — | **⚠ READY WITH CONDITIONS** |

**Path to ✅:** All **Pending** rows above → **Complete** with evidence, then certificate + tag + maintenance branch.
