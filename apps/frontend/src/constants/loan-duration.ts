export const LOAN_DURATION_WEEK_OPTIONS = [4, 8, 10, 12, 16, 20, 24, 26, 36, 52] as const;

export type LoanDurationWeeks = (typeof LOAN_DURATION_WEEK_OPTIONS)[number];

export function formatLoanDurationLabel(weeks: number): string {
  return `${weeks} weeks`;
}
