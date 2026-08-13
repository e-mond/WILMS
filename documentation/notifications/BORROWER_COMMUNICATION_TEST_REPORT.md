# Borrower Communication Test Report

**Product version:** 1.8.0  
**Branch:** `feature/v1.8.0-borrower-communication-correction`  
**Date:** 13 August 2026  
**Language:** British English

## Commands executed

| Command | Result |
|---------|--------|
| `npm run type-check` | Passed (frontend + domain) |
| `npm run lint` | Passed (no ESLint warnings or errors) |
| `npm run test -w @wilms/domain` | Passed — 94 files, 301 tests |
| `npm run test` (frontend) | Passed — shard 1: 97 files / 277 tests; shard 2: 96 files / 272 tests |
| `npm run build` | Passed (existing nodemailer path-casing warnings only) |

## Domain coverage added or updated

| Area | File | What it locks |
|------|------|----------------|
| SMS copy | `templates.test.ts` | All 18 borrower SMS builders |
| Lifecycle sequence | `borrower-communication-lifecycle.test.ts` | Registration → approval → loan → admin fee → disbursement → reminder → missed → grace → escalation → completion |
| Emitter wiring | `borrower-communication-wiring.test.ts` | Admin fee not required on create/approve; required on disburse; group/collector/payment-day emitters |
| Payment templates | `payment-notifications.test.ts` | T−1 reminder and missed-payment wording |
| Admin fee SMS | `admin-fee-notifications.test.ts` | Receipt copy says prepared for disbursement; dedupe |
| Scheduler HTTP | `scheduler-http.test.ts` | Token-gated cron still runs |

## API / dispatch

Existing domain tests continue to cover notification endpoints (`scheduler-http`, `scheduler-access`), SMS/email/in-app/push (`admin-fee-notifications`, `in-app-mirrors-push`, `push-inapp-preferences`, `mail-dispatch`).

## Integration sequence (code-backed)

Covered by wiring + template tests rather than a live database journey:

1. Registration → approval (SMS builders + `notifyRegistrationSubmitted` / `notifyRegistrationApproved` call sites)  
2. Approval → loan creation (`notifyLoanCreated` in `createLoan`)  
3. Loan approval → admin fee instruction (`notifyLoanApproved` + `adminFeePesewas`; fee gate removed from create/approve)  
4. Admin fee → disbursement (`notifyAdminFeeRecorded` copy; `assertAdminFeeRecorded` on `disburseLoan` only)  
5. Disbursement → schedule (`notifyLoanDisbursed` sends disbursement then schedule SMS)  
6. Schedule → reminder / due today / missed / grace / escalation (scheduler + ladder)  
7. Payment → completion (`weeksPaid` multi-week SMS; `notifyLoanFullyPaid`)  

## Result

All automated tests executed for this sprint passed.
