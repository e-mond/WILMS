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

const PAYMENT_DAY_SET = new Set<string>(PAYMENT_DAY_OPTIONS);

export function isValidPaymentDay(value: string): value is PaymentDay {
  return PAYMENT_DAY_SET.has(value);
}
