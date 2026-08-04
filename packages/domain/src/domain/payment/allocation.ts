import type { ScheduleWeekDto } from '../loan/mappers.js';

export function isWeekPayable(week: ScheduleWeekDto, referenceDate: string): boolean {
  if (week.status === 'PAID') {
    return false;
  }

  if (week.status === 'MISSED') {
    return true;
  }

  return week.status === 'PENDING' && week.dueDate <= referenceDate;
}

export function getOldestPayableWeek(
  scheduleWeeks: ScheduleWeekDto[],
  referenceDate: string,
): ScheduleWeekDto | undefined {
  return scheduleWeeks.find((week) => isWeekPayable(week, referenceDate));
}

export function validatePaymentSubmission(input: {
  amountPesewas: number;
  weeklyPaymentPesewas: number;
  paymentDay: string;
  referenceDate: string;
  scheduleWeeks: ScheduleWeekDto[];
}): string | undefined {
  if (input.amountPesewas < input.weeklyPaymentPesewas) {
    return 'Partial payments are not allowed. Pay the full weekly amount.';
  }

  if (input.amountPesewas > input.weeklyPaymentPesewas) {
    return 'Overpayment is not allowed. Pay exactly the weekly amount.';
  }

  const referenceWeekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${input.referenceDate}T00:00:00.000Z`));

  const oldestPayable = getOldestPayableWeek(input.scheduleWeeks, input.referenceDate);
  if (!oldestPayable) {
    return 'No outstanding obligation is due. Advance payments are not allowed.';
  }

  // Allow payment on the loan's assigned weekday OR on a holiday-shifted due date.
  const dueWeekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${oldestPayable.dueDate}T00:00:00.000Z`));

  const weekdayAllowed =
    referenceWeekday === input.paymentDay ||
    referenceWeekday === dueWeekday ||
    input.referenceDate === oldestPayable.dueDate;

  if (!weekdayAllowed) {
    return `Payments can only be recorded on the assigned payment day (${input.paymentDay}) or the scheduled due date after holiday adjustment (${oldestPayable.dueDate}).`;
  }

  return undefined;
}

export function applyPaymentToSchedule(
  scheduleWeeks: ScheduleWeekDto[],
  referenceDate: string,
): { weeks: ScheduleWeekDto[]; weekNumber?: number } {
  const oldestWeek = getOldestPayableWeek(scheduleWeeks, referenceDate);

  if (!oldestWeek) {
    return { weeks: scheduleWeeks };
  }

  return {
    weekNumber: oldestWeek.weekNumber,
    weeks: scheduleWeeks.map((week) =>
      week.weekNumber === oldestWeek.weekNumber ? { ...week, status: 'PAID' } : week,
    ),
  };
}
