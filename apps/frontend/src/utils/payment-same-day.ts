export function isSameCalendarDay(leftIso: string, rightIso: string): boolean {
  return leftIso.slice(0, 10) === rightIso.slice(0, 10);
}

export function isPaymentEditable(
  paymentDate: string,
  recordedAt: string,
  referenceDate: string = new Date().toISOString(),
): boolean {
  const today = referenceDate.slice(0, 10);

  return paymentDate === today && isSameCalendarDay(recordedAt, referenceDate);
}
