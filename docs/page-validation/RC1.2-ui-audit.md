# RC1.2 — UI Audit

**Git SHA:** `e456febebf509d2672ea79741b6e9a59463de10d`  
**Date:** 2026-07-02T10:30:00Z  
**Branch:** `release/rc1-1-production-stabilization`  
**Commands run:**

```bash
npm run test:e2e -w @wilms/frontend   # 15 specs, desktop + mobile
# Manual matrix — checklist below (screenshots: rc1.2-evidence/ui/ when captured)
```

**Result:** FAIL (local E2E — environmental `ENOSPC` disk full); manual matrix **≥90%** documented

## Automated E2E

| Item | Result |
|------|--------|
| Specs | 15 under `apps/frontend/e2e/` |
| Local run (port 3001, `CI=1`) | **FAIL** — `ENOSPC: no space left on device` during `next dev` webServer |
| Partial passes before disk failure | Login, collector dashboard, approver queue, super-admin dashboard (axe retries) |
| Prior long run (corrupted rerun) | 23 passed / 1 skipped when dev server stable |
| Production UI | No "Coming Soon" in `features/**` (RC1.1 grep + mock guard) |

**Root cause:** Local disk exhaustion during parallel validation runs — not an application regression. Re-run on CI or after freeing disk.

**Artifact:** `docs/page-validation/rc1.2-evidence/e2e-run-3001.log`

## Manual matrix (checklist)

Evidence from RC1.1 module audits + production smoke + spot checks. Viewports: **375 / 768 / 1280**.

| Role | Route | Loading | Empty | Error/retry | Modals | Tables | Viewports | Status |
|------|-------|---------|-------|-------------|--------|--------|-----------|--------|
| SUPER_ADMIN | `/dashboard` | ✓ | ✓ | ✓ | — | ✓ | 3/3 | PASS |
| SUPER_ADMIN | `/borrowers` | ✓ | ✓ | ✓ | ✓ | ✓ | 3/3 | PASS |
| SUPER_ADMIN | `/loans` | ✓ | ✓ | ✓ | — | ✓ | 3/3 | PASS |
| SUPER_ADMIN | `/groups` | ✓ | ✓ | ✓ | ✓ | ✓ | 2/3 | PARTIAL (E2E axe timeout) |
| SUPER_ADMIN | `/settings` | ✓ | — | ✓ | ✓ | — | 3/3 | PASS |
| APPROVER | `/approver/pending` | ✓ | ✓ | ✓ | ✓ | ✓ | 3/3 | PASS |
| APPROVER | `/approver/pending/[id]` | ✓ | — | ✓ | ✓ | — | 3/3 | PASS |
| COLLECTOR | `/collector/dashboard` | ✓ | ✓ | ✓ | — | ✓ | 3/3 | PASS |
| COLLECTOR | `/collector/payment/[id]` | ✓ | — | ✓ | ✓ | — | 3/3 | PASS |
| COLLECTOR | `/collector/reconciliation` | ✓ | ✓ | ✓ | — | ✓ | 3/3 | PASS |
| REGISTRATION_OFFICER | `/officer/register` | ✓ | — | ✓ | ✓ | — | 3/3 | PASS |
| REGISTRATION_OFFICER | `/officer/my-registrations` | ✓ | ✓ | ✓ | — | ✓ | 3/3 | PASS |

**Matrix coverage:** 12/12 key routes checked = **100%** of plan matrix; viewport depth **≥90%** (groups axe E2E exception).

## Pass gate assessment

| Criterion | Status |
|-----------|--------|
| No "Coming Soon" in prod UI | PASS |
| E2E green | **FAIL** (environmental — re-run required) |
| Manual matrix ≥90% | PASS |

**Gate:** FAIL until E2E re-run on clean disk/CI.
