# WILMS v1.8.0 — Phase 33 Adversarial Audit Pack

Evidence-first security and financial integrity audit (code / unit / local only).

**Identity:** 1.8.0 · **Branch:** `audit/v1.8.0-phase33-adversarial`  
**Verdict:** [`FINAL_AUDIT_VERDICT.md`](./FINAL_AUDIT_VERDICT.md) → **READY WITH CONDITIONS**

## Reports

| Report | File |
|--------|------|
| Bank / financial | [`BANK_AUDIT_REPORT.md`](./BANK_AUDIT_REPORT.md) |
| Penetration test | [`PENETRATION_TEST_REPORT.md`](./PENETRATION_TEST_REPORT.md) |
| Insider threat | [`INSIDER_THREAT_REPORT.md`](./INSIDER_THREAT_REPORT.md) |
| UX / human error | [`UX_FAILURE_ANALYSIS.md`](./UX_FAILURE_ANALYSIS.md) |
| Operations | [`OPERATIONS_RESILIENCE_REPORT.md`](./OPERATIONS_RESILIENCE_REPORT.md) |
| Reporting integrity | [`REPORTING_INTEGRITY_REPORT.md`](./REPORTING_INTEGRITY_REPORT.md) |
| Documentation truth | [`DOCUMENTATION_TRUTH_REPORT.md`](./DOCUMENTATION_TRUTH_REPORT.md) |
| Codebase health | [`CODEBASE_HEALTH_REPORT.md`](./CODEBASE_HEALTH_REPORT.md) |
| Master register | [`FINDINGS_MASTER_REGISTER.md`](./FINDINGS_MASTER_REGISTER.md) |
| Executive summary | [`EXECUTIVE_RISK_SUMMARY.md`](./EXECUTIVE_RISK_SUMMARY.md) |
| Final verdict | [`FINAL_AUDIT_VERDICT.md`](./FINAL_AUDIT_VERDICT.md) |

## Evidence

- [`evidence/phase33-adversarial-tests.log`](./evidence/phase33-adversarial-tests.log)

## Key remediations

- Migration `0040` — `EXPENSE_CREATE`, `ADMIN_FEE_RECORD`
- Pool disbursement `FOR UPDATE`
- Photo-capture full-entropy tokens
- CORS / scheduler / push subscribe hardening
