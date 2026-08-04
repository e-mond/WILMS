# Reconciliation Idempotency Report (v1.4.3)

## Problem

Production flag `WILMS_FLAG_REQUIRE_IDEMPOTENCY` (default true with DB) rejects money POSTs without `Idempotency-Key`, returning `IDEMPOTENCY_REQUIRED` / HTTP 400. Reconciliation submit failed in the browser because `apiClient` never attached the header.

## Fix

1. Extended `RequestOptions` with `headers` in [`apps/frontend/src/utils/apiClient.ts`](apps/frontend/src/utils/apiClient.ts).
2. Added [`financialMutation()`](apps/frontend/src/utils/financialMutation.ts):
   - Generates UUID Idempotency-Key per mutation lifecycle
   - Reuses key when caller supplies one (retry-safe)
   - Maps domain errors without leaking header/validation internals
3. Migrated callers:
   - `POST /reconciliations`
   - `POST /payments`, `POST /payments/:id/reverse`
   - `POST /loans`, `POST /loans/:id/disburse`
   - `POST /adjustments`, `POST /adjustments/:id/approve`

## Duplicate submit behavior

Backend `runWithIdempotency` replays the stored response for the same scope+key+payload hash. FE unit tests prove key generation/reuse and friendly mapping when the header is missing.

## Residual

Expense approve and admin-fee POST are not in the backend idempotency scope enum; left unchanged.
