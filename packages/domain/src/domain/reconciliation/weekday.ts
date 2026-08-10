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

/**
 * Earliest collection day on or after `fromIsoDate` that matches any assigned
 * payment weekday. Returns null when no payment days are available.
 */
export function resolveNextCollectionDueDate(
  paymentDays: string[],
  fromIsoDate: string,
): string | null {
  const normalized = [
    ...new Set(paymentDays.map(normalizePaymentDay).filter((day) => Boolean(day))),
  ];
  if (normalized.length === 0) {
    return null;
  }

  const start = new Date(`${fromIsoDate}T12:00:00Z`);
  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = new Date(start);
    candidate.setUTCDate(start.getUTCDate() + offset);
    const iso = candidate.toISOString().slice(0, 10);
    if (normalized.includes(getWeekdayNameFromIsoDate(iso))) {
      return iso;
    }
  }

  return null;
}
