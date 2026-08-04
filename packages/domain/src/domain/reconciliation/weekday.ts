const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** Operations calendar — Ghana (UTC+0 / Africa/Accra). */
export const WILMS_CALENDAR_TIME_ZONE = 'Africa/Accra';

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

/** Today as yyyy-mm-dd in the WILMS operations calendar (not host UTC drift). */
export function localIsoDate(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: WILMS_CALENDAR_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
