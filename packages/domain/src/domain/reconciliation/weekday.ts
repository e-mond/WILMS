const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export function getWeekdayNameFromIsoDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  return WEEKDAY_NAMES[date.getUTCDay()]!;
}

/** Normalize payment-day labels so MONDAY / monday / Monday all match. */
export function normalizePaymentDay(paymentDay: string): string {
  const trimmed = paymentDay.trim();
  if (!trimmed) {
    return trimmed;
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export function isLoanDueOnDate(paymentDay: string, reconciliationDate: string): boolean {
  return normalizePaymentDay(paymentDay) === getWeekdayNameFromIsoDate(reconciliationDate);
}
