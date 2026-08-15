# Settings enforcement report — WILMS v1.8.1

Administrators’ loan-roles settings are now the source of truth for group capacity and maximum loan principal.

## Behaviour

1. Super Admin saves min/max group size and max loan amount in Settings.
2. Domain services call `getSettings()` (database row, with in-memory fallback when the database is disabled).
3. Group add / create / formation queue / membership removal use those integers.
4. Loan create rejects amounts above `maxLoanAmountPesewas`.

## User-facing capacity error

`Airport Ridge Group 001 has reached the configured maximum size of 10 members. Create a new group or choose another group.`

## Validation

- Domain unit tests for capacity copy and wiring
- Existing group membership mock tests remain settings-driven on the frontend mock layer
