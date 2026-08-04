# Collector Workflow Report

**Release:** 1.2.2

## Administration fee business rule

Borrower administration fees are **one-time per borrower** before the first loan disbursement. They are **not** tied to collector login or daily collection cycles.

## Login behaviour

- Collectors land on `/collector/dashboard` after sign-in.
- No modal, redirect, or gate forces fee recording on login.
- `getCollectorAdminFeeLoginGate()` always returns `{ requiresPrompt: false }`.

## When fees are required

1. A borrower reaches `APPROVED` status.
2. Borrower appears in `/collector/admin-fee` queue (`GET /borrowers/awaiting-admin-fee`).
3. Collector records fee via `/collector/admin-fee/[borrowerId]`.
4. Fee is stored in `borrower_admin_fees` (durable).
5. Loan creation/disbursement gates check fee status.

## Fix in v1.2.2

Previously, admin fees were stored in an in-memory `Map` in the API process. After a Railway restart, fees appeared unpaid and collectors had to re-record them — often perceived as “every login.” Fees now persist in Postgres.

## Alignment

| Layer | Rule |
|-------|------|
| Backend `transactions/service.ts` | Persist fee; duplicate blocked per borrower |
| Frontend login | No admin-fee redirect |
| Loan disbursement | Requires fee for borrower |
| Settings | `adminFeePesewas` configurable by Super Admin |
