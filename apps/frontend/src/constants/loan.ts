export const LOAN_STEP_LABELS = [
  'Borrower',
  'Loan amount',
  'Schedule',
  'Preview',
] as const;

export const PAYMENT_DAY_OPTIONS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type PaymentDay = (typeof PAYMENT_DAY_OPTIONS)[number];

export const LOAN_CYCLE_BATCH_OPTIONS = [
  'Cycle 1 — January 2026',
  'Cycle 2 — April 2026',
  'Cycle 3 — July 2026',
  'Cycle 4 — October 2026',
] as const;

/** Suggested presets; users may enter additional custom cycle labels. */
export const LOAN_CYCLE_BATCH_SUGGESTIONS = LOAN_CYCLE_BATCH_OPTIONS;

export type LoanCycleBatch = (typeof LOAN_CYCLE_BATCH_OPTIONS)[number];
