# WILMS Advanced Lending

**Version:** 1.3.0

## Repayment Engine

WILMS uses zero-interest weekly installments by default. The core schedule generator lives in `apps/backend/src/domain/loan/schedule.ts`.

### Repayment Cadences (v1.3.0)

| Cadence | Day offset |
|---------|------------|
| WEEKLY | 7 |
| BIWEEKLY | 14 |
| MONTHLY | 30 |
| QUARTERLY | 90 |
| BALLOON | 7 (final lump configurable in v1.3.1) |
| GRADUATED | 7 (tiered amounts in v1.3.1) |

Schema column: `loans.repayment_cadence` (migration `0020_v130_field_operations.sql`).

### Grace Periods

System setting `latePaymentGraceDays` (default 3) is applied in `applyMissedWeekMarking()`. A week is not marked MISSED until `dueDate + graceDays < referenceDate`.

Per-loan override: `loans.grace_days_override`.

## Fees Engine

| Fee type | Status |
|----------|--------|
| Administration fee (pre-disbursement) | Production — `borrower_admin_fees` |
| Processing, late, insurance, documentation | Schema + domain (`loan_fee_charges`) |

Domain: `apps/backend/src/domain/loan/fees.ts`

## Penalty Engine

Configurable rules in `loan_penalty_rules` table. Domain calculations in `apps/backend/src/domain/loan/penalties.ts`:

- Flat, percentage, daily, weekly, monthly
- Maximum cap and waiver helper

Penalties are not auto-applied in v1.3.0; rules are ready for workflow integration in v1.3.1.

## Guarantor Scoring

Eligibility rules remain in `guarantor-eligibility.ts`. v1.3.0 adds scoring in `apps/backend/src/domain/guarantor/scoring.ts`:

- Eligibility score 0–100
- Risk rating: LOW / MEDIUM / HIGH
- Factor explanations for UI display

## Holiday Calendar

Table `organization_holidays` stores national, branch, and organization holidays. Repayment date shifting is planned for v1.3.1.

## Restructuring & Refinancing

Use financial adjustments for balance corrections and write-offs today. Dedicated restructure/refinance workflows are extension points for v1.3.1+.

## Related

- `docs/page-validation/P14.3A.1-financial-verification.md`
- `ADVANCED_LENDING_REPORT.md`
