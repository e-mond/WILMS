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
  return WEEKDAY_NAMES[date.getUTCDay()];
}

/** Normalize payment-day labels so MONDAY / monday / Monday all match. */
export function normalizePaymentDay(paymentDay: string): string {
  const trimmed = paymentDay.trim();
  if (!trimmed) {
    return trimmed;
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export function isLoanDueOnDate(paymentDay: string, referenceDate: string): boolean {
  return normalizePaymentDay(paymentDay) === getWeekdayNameFromIsoDate(referenceDate);
}

/** Local calendar yyyy-mm-dd (collector timezone), not UTC. */
export function localIsoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
