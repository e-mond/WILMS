# Dead Code Report — Phase 27

## Actions

- No broad deletion pass this phase (risk of removing dynamic usage)
- Consolidated token hashing into `lib/secure-token.ts`
- Expense create no longer embeds self-approve ledger path

## Residual

Defaulter report still uses full list load — intentional until SQL rewrite; fail-closed retained.
