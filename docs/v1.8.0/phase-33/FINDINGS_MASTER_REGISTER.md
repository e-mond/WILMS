# Phase 33 — Findings Master Register

**Identity:** WILMS v1.8.0 · Branch `audit/v1.8.0-phase33-adversarial`

| ID | Title | Severity | Probability | Business impact | Exploitability | Modules | Fix | Effort | Test path | Status |
|----|-------|----------|-------------|-----------------|----------------|---------|-----|--------|-----------|--------|
| H1 | Expense / admin-fee missing idempotency | High | Med | Duplicate expense / fee records | Easy (double POST) | expenses, transactions, idempotency | Scopes + `runWithIdempotency` + FE keys; mig 0040 | S | `tests/phase33/expense-admin-fee-idempotency-wiring.test.ts` | **Remediated** |
| H2 | Pool hard-stop race on disburse | High | Low–Med | Over-allocate pool capital | Concurrent disburse | loans, loan-pools | `findPoolByIdForUpdate` | S | `tests/phase33/adversarial-remediation.test.ts`, wiring test | **Remediated** |
| H3 | Weak photo-capture token entropy | Medium | Low | Guess/spray capture sessions | Unauth token spray | photo-capture | Full UUID hex token | XS | `adversarial-remediation.test.ts` H3 | **Remediated** |
| H4 | CORS localhost default in serverless prod | Medium | Med | Origin misconfig risk | Env omission | config/env, validate-env | Fail-closed validate | XS | `adversarial-remediation.test.ts` H4 | **Remediated** |
| H5 | Docs claim same-day payment edit | Medium (docs) | High (confusion) | Wrong SOP / support load | N/A (docs) | docs, payments | Traceability + architecture truth | XS | `payment-immutability.test.ts` | **Remediated (docs)** |
| H6 | Offline queue / conflict SoD | Info | Low | Self-approve sync conflict | Insider + offline | sync | Existing SoD suites | — | `tests/sync/sod-self-approve.test.ts` | Residual / no new defect |
| H7 | Scheduler wrong-token session fallthrough | Medium | Low | Cron abuse with stolen session | Wrong bearer + session | require-scheduler-access | Fail closed on bad token | XS | H7 unit + scheduler-http | **Remediated** |
| H8 | Push subscribe spam | Low–Med | Med | DB bloat / noise | Authenticated spam | notifications/push | Cap 10 / user | XS | H8 unit tests | **Remediated** |
| H9 | Maker-checker residual | Info | Low | SoD bypass | Insider | loans/expenses/recon | Existing suites green | — | `sod-*.test.ts` | Residual / no new defect |
| H10 | Recon/reporting inconsistency | Info | Low | Misstated totals | N/A | loan-pool balance | Formula unit check | — | H10 unit | Residual / no new defect |
| R1 | Playwright / device smoke | Residual | — | Cert gate | Ops | frontend E2E | Run browsers + smoke | M | — | Open |
| R2 | Prod smoke credentials / DR drill | Residual | — | Cert gate | Ops | ops | Credentialed read-only smoke + DR | M | — | Open |
| R3 | Neon migrate 0040 | Residual | — | Runtime enum failure if skipped | Deploy | db | Apply 0040 | XS | verify:migrations | **Required before prod** |
| FP1 | CSRF on direct `:4000` API | Info / arch | — | Known dual-run gap | Direct API | BFF vs API | Prefer BFF | — | — | Accepted residual |

## Severity closed this phase

- Critical: **0 confirmed remaining**
- High: **0 remaining** (H1, H2 remediated)
- Medium: **0 remaining code** (H3/H4/H7 remediated; H5 docs fixed)
