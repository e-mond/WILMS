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

export function isLoanDueOnDate(paymentDay: string, referenceDate: string): boolean {
  return paymentDay === getWeekdayNameFromIsoDate(referenceDate);
}
