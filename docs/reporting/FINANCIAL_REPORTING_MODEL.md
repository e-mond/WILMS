# Financial reporting model (v1.7)

Executive KPIs derive from:

1. Loan pool aggregates (capital, disbursed, outstanding, collected)
2. Confirmed payments excluding reversals
3. Approved expenses (operating cash only)
4. Aging analysis from loan schedule week statuses
5. Write-off adjustments (approved/pending)

See `packages/domain/src/modules/dashboard/financial-overview.ts` and `modules/intelligence/service.ts`.
