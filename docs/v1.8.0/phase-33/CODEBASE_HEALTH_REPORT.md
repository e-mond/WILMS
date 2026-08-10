# Phase 33 — Codebase Health Report

**Identity:** WILMS v1.8.0

## Transaction / control boundaries

| Path | Assessment |
|------|------------|
| Expense create | Now idempotent-scoped; insert remains single-statement (approval still separate) |
| Admin fee | Idempotent-scoped + borrower duplicate guard |
| Disburse + pool | Hard-stop under `FOR UPDATE` inside disbursement transaction |
| Photo-capture public upload | CSRF-exempt by design; entropy hardened |

## Dead / mock paths

- Mock same-day payment edit remains for `NEXT_PUBLIC_USE_MOCK=true` demos — residual theatre, not live API.
- Duplicate push-inapp paths: prior push remediation assumed; Phase 33 adds subscribe cap only.

## TODO / FIXME

No new blocking TODO introduced. Phase 33 focused on control hardening, not broad cleanup.

## Migrations

- Journal entry idx 40: `0040_v180_phase33_idempotency_scopes`
- Enum + TypeScript `IdempotencyScope` unions updated in lockstep

## Test debt closed this phase

`packages/domain/src/tests/phase33/*` — wiring, entropy, CORS, scheduler, push cap, immutability, pool math.
