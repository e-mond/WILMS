import { getWeekdayNameFromIsoDate } from '@/features/payment-collection/collector-dashboard.utils';
import { SCHEDULE_WEEK_STATUS, type LoanScheduleWeek } from '@/types/loan-schedule';
import type { PaymentEntryContext, PaymentObligationWeek } from '@/types/payment-entry';

export interface BuildPaymentEntryContextInput {
  borrowerId: string;
  borrowerName: string;
  phone: string;
  community: string;
  loanId: string;
  paymentDay: string;
  weeklyPaymentPesewas: number;
  scheduleWeeks: LoanScheduleWeek[];
  referenceDate?: string;
}

export function isPaymentDayForDate(paymentDay: string, referenceDate: string): boolean {
  return paymentDay === getWeekdayNameFromIsoDate(referenceDate);
}

export function isWeekPayable(week: LoanScheduleWeek, referenceDate: string): boolean {
  if (week.status === SCHEDULE_WEEK_STATUS.PAID) {
    return false;
  }

  if (week.status === SCHEDULE_WEEK_STATUS.MISSED) {
    return true;
  }

  return week.status === SCHEDULE_WEEK_STATUS.PENDING && week.dueDate <= referenceDate;
}

export function getPayableObligationWeeks(
  scheduleWeeks: LoanScheduleWeek[],
  referenceDate: string,
): PaymentObligationWeek[] {
  return scheduleWeeks
    .filter((week) => isWeekPayable(week, referenceDate))
    .map((week) => ({
      weekNumber: week.weekNumber,
      dueDate: week.dueDate,
      amountPesewas: week.amountPesewas,
      status: week.status,
    }));
}

export function getOldestPayableWeek(
  scheduleWeeks: LoanScheduleWeek[],
  referenceDate: string,
): LoanScheduleWeek | undefined {
  return scheduleWeeks.find((week) => isWeekPayable(week, referenceDate));
}

export function isOverpaymentAttempt(
  amountPesewas: number,
  weeklyPaymentPesewas: number,
): boolean {
  return amountPesewas > weeklyPaymentPesewas;
}

export function validatePaymentAmount(
  amountPesewas: number,
  weeklyPaymentPesewas: number,
): string | undefined {
  if (amountPesewas < weeklyPaymentPesewas) {
    return 'Partial payments are not allowed. Pay the full weekly amount.';
  }

  if (isOverpaymentAttempt(amountPesewas, weeklyPaymentPesewas)) {
    return 'Overpayment is not allowed. Pay exactly the weekly amount.';
  }

  return undefined;
}

export function validatePaymentSubmission({
  amountPesewas,
  weeklyPaymentPesewas,
  paymentDay,
  referenceDate,
  scheduleWeeks,
}: {
  amountPesewas: number;
  weeklyPaymentPesewas: number;
  paymentDay: string;
  referenceDate: string;
  scheduleWeeks: LoanScheduleWeek[];
}): string | undefined {
  const amountError = validatePaymentAmount(amountPesewas, weeklyPaymentPesewas);

  if (amountError) {
    return amountError;
  }

  if (!isPaymentDayForDate(paymentDay, referenceDate)) {
    return `Payments can only be recorded on the assigned payment day (${paymentDay}).`;
  }

  const oldestWeek = getOldestPayableWeek(scheduleWeeks, referenceDate);

  if (!oldestWeek) {
    return 'No outstanding obligation is due. Advance payments are not allowed.';
  }

  return undefined;
}

export function applyPaymentToOldestObligation(
  scheduleWeeks: LoanScheduleWeek[],
  referenceDate: string,
): LoanScheduleWeek[] {
  const oldestWeek = getOldestPayableWeek(scheduleWeeks, referenceDate);

  if (!oldestWeek) {
    return scheduleWeeks;
  }

  return scheduleWeeks.map((week) =>
    week.weekNumber === oldestWeek.weekNumber
      ? { ...week, status: SCHEDULE_WEEK_STATUS.PAID }
      : week,
  );
}

export function buildPaymentEntryContext({
  borrowerId,
  borrowerName,
  phone,
  community,
  loanId,
  paymentDay,
  weeklyPaymentPesewas,
  scheduleWeeks,
  referenceDate = new Date().toISOString().slice(0, 10),
}: BuildPaymentEntryContextInput): PaymentEntryContext {
  const isPaymentDay = isPaymentDayForDate(paymentDay, referenceDate);
  const obligationWeeks = getPayableObligationWeeks(scheduleWeeks, referenceDate);
  const oldestObligation = obligationWeeks[0];
  const totalOutstandingObligationsPesewas = obligationWeeks.reduce(
    (total, week) => total + week.amountPesewas,
    0,
  );

  let blockReason: string | undefined;
  let canAcceptPayment = Boolean(oldestObligation);

  if (!isPaymentDay) {
    canAcceptPayment = false;
    blockReason = `Today is not this borrower's payment day (${paymentDay}).`;
  } else if (!oldestObligation) {
    canAcceptPayment = false;
    blockReason = 'No outstanding obligation is due. Advance payments are not allowed.';
  }

  return {
    borrowerId,
    borrowerName,
    phone,
    community,
    loanId,
    paymentDay,
    weeklyPaymentPesewas,
    referenceDate,
    isPaymentDay,
    requiredAmountPesewas: weeklyPaymentPesewas,
    oldestObligation,
    obligationWeeks,
    totalOutstandingObligationsPesewas,
    canAcceptPayment,
    blockReason,
  };
}
