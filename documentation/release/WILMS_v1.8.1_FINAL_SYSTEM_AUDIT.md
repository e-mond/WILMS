# WILMS v1.8.1 — Final system audit report

**Classification:** Confidential  
**Date:** 17 August 2026  
**Branch:** `audit/v1.8.1-final-system-audit`  
**Baseline merge:** `0085c41fa0ed97d8a2f5181bbbdf37f625afe9d4` (PR #209)  
**Release identity:** v1.8.1 (no version bump)  
**Audit mode:** Local/preview + read-only production probes — **no production data mutation**

---

## Verdict

**READY WITH CONDITIONS**

This sprint **cannot** award **PRODUCTION CERTIFIED** under the binding no-production-mutation policy. Code and automated tests support core financial and lifecycle controls; five P1/P2 defects were fixed on the audit branch with regression tests. Remaining conditions: migration countGap, live SMS/cron proof, and operator workflow smoke.

---

## Production baseline (read-only, 17 August 2026)

| Item | Value |
|------|-------|
| URL | https://wilms.vercel.app |
| Health | ok |
| Version | 1.8.1 |
| gitCommit | 0085c41… |
| Database | connected |
| Migrations | expected 45, applied 44, countGap true |
| SMS | smsnotifygh configured |
| Mail | Gmail configured |
| Scheduler | http_triggered |
| Cron path | GET /api/cron/notifications |
| Cron schedule | 0 6 * * * UTC (06:00 Ghana) |
| Cron unauthenticated | 401 |
| Env names present | CRON_SECRET, WILMS_SCHEDULER_TOKEN (values not logged) |

---

## Score (out of 100)

**Total: 78 / 100**

Formula: sum of dimension scores below. Live-production evidence dimension is capped because audit policy blocked authenticated production smoke.

| Dimension | Score | Max | Notes |
|-----------|------:|----:|-------|
| Critical workflow correctness | 17 | 20 | P1 fixes on approve, guarantor, records RBAC |
| Financial / pool integrity | 17 | 18 | Disburse lock verified; create-time reserve documented gap |
| Data integrity / migrations | 12 | 15 | countGap P2 |
| Communications / notifications | 10 | 15 | T-1 code verified; live SMS/cron BLOCKED |
| Security / RBAC / settings honesty | 14 | 15 | P1 records fix; settings copy fixed |
| Automated test evidence | 9 | 10 | Gates run on audit branch (see below) |
| Live production / operator evidence | 0 | 7 | BLOCKED by policy — not scored as pass |
| Documentation / audit hygiene | 9 | 10 | Four release docs delivered |

---

## Explicit audit questions

### What is complete?

- Registration → approval → grouping → loan create → approve → admin fee → disburse → repayments → close (domain rules + tests)
- Guarantor cap of 3 (non-leader); leader cap 5 after fix
- Payment allocation, reconciliation SoD, pool lock at disburse
- T-1 scheduler logic and SMS dedupe (unit tests)
- CSRF, session HMAC, cron 401 without secret
- Group size limits from settings (post v1.8.1 hotfix)
- Super Admin mobile nav drawer (code + jsdom; live BLOCKED)

### What is partial?

- End-to-end lifecycle on real DB (no DATABASE_URL in audit environment)
- Notification matrix (some emitters unwired)
- Settings enforcement (many stored fields display-only)
- PWA/offline (shell yes; mark-missed online-only)
- Playwright e2e (run when browsers available)
- T-1 SMS delivery and cron execution in production logs

### What is broken?

- **Pre-audit:** five P1/P2 items in bug register — **fixed on branch, not merged**
- Migration countGap remains in production health

### What is hard-coded?

- Session TTL from env (~24h), not settings minutes
- Password minimum length 10 in code vs policy UI
- SMS provider/sender from env
- Default loan duration 12 weeks in UI
- Reconciliation variance defaults differ (DB 5 vs code path 10)

### What is inconsistent?

- **Fixed on branch:** loan approve UI vs API; settings SMS/2FA labels; records RBAC
- **Open:** gpsVerificationEnabled vs always-on collector GPS; maxGroupSize mapper fallback 10 vs schema 15

### What is insecure?

- No P0 auth bypass found in static review
- **Fixed:** collector org-wide records search (IDOR-style data exposure)

### What is undocumented?

- GhanaPost explicitly documented as plan-only
- Pool create vs disburse capital window documented in matrix/backlog
- Some notification matrix rows describe unwired staff alerts

### What is untested?

- Live cron at 06:00 UTC
- Live SMS to real numbers
- Full WCAG 2.2 AA
- Backup/restore / DR
- Production PDF open on real borrowers

### What is unproven in production?

- T-1 SMS delivery
- Super Admin mobile drawer on device
- Record Centre operator UX
- Collector GPS on physical device
- Push OS notification delivery

### What should not be built yet?

- GhanaPost GPS integration (plan only)
- Second notification/cron system
- Speculative settings enforcement without product sign-off (session timeout wiring, etc.)

---

## Top 10 remaining risks

1. Live T-1 SMS/cron never observed in this audit
2. Migration countGap (45 vs 44) on production
3. Operator workflow smoke not run (demo blocked in prod)
4. Settings UI implies controls that are not enforced (session, IP, GPS flag)
5. Pool capital race between concurrent loan creates before disburse
6. Approver APPROVE_LOANS without loan UI (confusion / support calls)
7. Guarantor lifecycle SMS without dedupe on approve/close paths (lower risk than missed)
8. Dead notification emitters vs documentation matrix
9. maxGroupSize fallback mismatch on empty DB bootstrap
10. WCAG certification not claimed; axe is sample only

---

## Must-fix vs can wait

**Must-fix before claiming production certified**

- Merge audit branch after owner review (V181-001–005)
- Apply missing migration (V181-010)
- Authorised live SMS + cron log check (V181-011)
- Operator smoke checklist (V181-012)

**Can wait (backlog)**

- V181-013–018, V181-030–035 (see bug register)
- GhanaPost, DR, WCAG cert

---

## Remediation summary (audit branch)

| ID | Fix |
|----|-----|
| V181-001 | Approve button no longer requires admin fee |
| V181-002 | Guarantor missed SMS dedupe |
| V181-003 | Records search requires ACCESS_REGISTRATION_PORTAL |
| V181-004 | Leader guarantor cap enforced at 5 |
| V181-005 | Settings copy for global SMS and all-user 2FA |

---

## Engineering gates (audit branch)

| Gate | Result | Notes |
|------|--------|-------|
| type-check | **Pass** | `@wilms/frontend` + `@wilms/domain` |
| lint | **Pass** | `next lint` — no warnings |
| domain tests | **Pass** | 347 tests (101 files) |
| gap tests (new) | **Pass** | records RBAC, guarantor dedupe, leader cap, loan approve UI wiring |
| frontend targeted | **Pass** | `loan-approve-fee-gate.test.ts` |
| build | **Blocked in audit env** | `next build` stalls on Google Fonts CDN (`ECONNRESET`); re-run on CI or network-stable host |
| Playwright e2e | **Not run** | Optional; requires local browsers + dev server |

Re-run locally:

```bash
npm run type-check
npm run lint
npm run test -w @wilms/domain
npx vitest run -C apps/frontend src/tests/loan-management/loan-approve-fee-gate.test.ts
npm run build
```

---

## Deliverables

| Document | Path |
|----------|------|
| Documentation vs implementation | documentation/release/DOCUMENTATION_VS_IMPLEMENTATION_AUDIT.md |
| Audit matrix | documentation/release/FINAL_V181_SYSTEM_AUDIT_MATRIX.md |
| Bug register | documentation/release/FINAL_V181_BUG_REGISTER.md |
| This report | documentation/release/WILMS_v1.8.1_FINAL_SYSTEM_AUDIT.md |

---

## Merge recommendation

**Do not merge to `main` until the project owner reviews FINAL_V181_BUG_REGISTER.md.**

After review: merge audit branch, deploy preview, run authorised operator smoke, then reassess score (live evidence dimension may increase to +5–7).

---

## Related prior releases

- v1.8.1 maintenance: PR #209 (T-1 SMS, Super Admin mobile nav)
- Settings/notifications/records: PR #206
- v1.8.0 certification baseline: documentation/release/WILMS_v1.8.0_FINAL_PRODUCTION_RELEASE_REPORT.md
