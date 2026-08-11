# Pool Capital Validation Report

**Product:** WILMS v1.8.0  
**Status:** Implemented

## Problem

Loans could be created when the selected pool lacked capital, then fail only at disbursement.

## Solution

### Backend

Before insert, `createLoan` compares `amountPesewas` to `capitalPesewas - outstandingPesewas`.

Rejection example:

> Cannot create loan. Selected pool: Community Growth Pool. Available capital: GH₵301.00. Requested loan: GH₵400.00. Additional funding required: GH₵99.00.

Disbursement hard-stop retained with the same user-facing currency wording.

### Frontend

`CreateLoanWizard` shows live available capital, blocks step advance/submit when the amount exceeds available capital, and surfaces the shortfall alert.

## Tests

- `packages/domain/src/tests/loans/pool-capital-create.test.ts`
