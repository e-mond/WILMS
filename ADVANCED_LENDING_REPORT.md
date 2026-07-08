# Advanced Lending Report — v1.3.0

## Grace Periods

`latePaymentGraceDays` from system settings is now applied in `applyMissedWeekMarking()` across payments and loan schedule reads.

## Repayment Cadences

Domain module `schedule-cadence.ts` supports WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, BALLOON, and GRADUATED offsets. `generateLoanScheduleWeeks()` accepts optional `cadence`.

## Fees Engine

- Migration table `loan_fee_charges`
- Domain `fees.ts` with fee types and exemption support

## Penalty Engine

- Migration table `loan_penalty_rules`
- Domain `penalties.ts` with flat, percentage, daily, weekly, monthly calculations and waiver helper

## Guarantor Scoring

- Domain `guarantor/scoring.ts` produces eligibility score and LOW/MEDIUM/HIGH risk rating

## Holiday Calendar

- Migration table `organization_holidays` for national, branch, and organization holidays (shift logic in v1.3.1)

## Restructuring / Refinancing

Architectural extension points documented; approval workflows reuse existing adjustments module.
