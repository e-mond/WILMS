import type { ScheduleWeekDto } from '../loan/mappers.js';
import { normalizePaymentDay } from '../reconciliation/weekday.js';

export function isWeekPayable(week: ScheduleWeekDto, referenceDate: string): boolean {
  if (week.status === 'PAID') {
    return false;
  }

  if (week.status === 'MISSED') {
    return true;
  }

  return week.status === 'PENDING' && week.dueDate <= referenceDate;
}

export function getPayableWeeks(
  scheduleWeeks: ScheduleWeekDto[],
  referenceDate: string,
): ScheduleWeekDto[] {
  return scheduleWeeks
    .filter((week) => isWeekPayable(week, referenceDate))
    .sort((left, right) => left.weekNumber - right.weekNumber);
}

export function getOldestPayableWeek(
  scheduleWeeks: ScheduleWeekDto[],
  referenceDate: string,
): ScheduleWeekDto | undefined {
  return getPayableWeeks(scheduleWeeks, referenceDate)[0];
}

export function getOldestPayableWeeks(
  scheduleWeeks: ScheduleWeekDto[],
  referenceDate: string,
  weeksCount: number,
): ScheduleWeekDto[] {
  if (weeksCount < 1) {
    return [];
  }
  return getPayableWeeks(scheduleWeeks, referenceDate).slice(0, weeksCount);
}

export function validatePaymentSubmission(input: {
  amountPesewas: number;
  weeklyPaymentPesewas: number;
  paymentDay: string;
  referenceDate: string;
  scheduleWeeks: ScheduleWeekDto[];
  weeksCount?: number;
}): string | undefined {
  const weeksCount = input.weeksCount ?? 1;
  if (!Number.isInteger(weeksCount) || weeksCount < 1) {
    return 'weeksCount must be a positive integer.';
  }

  const expectedAmount = input.weeklyPaymentPesewas * weeksCount;
  if (input.amountPesewas !== expectedAmount) {
    if (weeksCount === 1 && input.amountPesewas < input.weeklyPaymentPesewas) {
      return 'Partial payments are not allowed. Pay the full weekly amount.';
    }
    if (weeksCount === 1 && input.amountPesewas > input.weeklyPaymentPesewas) {
      return 'Overpayment is not allowed. Pay exactly the weekly amount.';
    }
    return `Payment amount must equal ${weeksCount} × weekly installment (${expectedAmount} pesewas).`;
  }

  const payable = getPayableWeeks(input.scheduleWeeks, input.referenceDate);
  if (payable.length === 0) {
    return 'No outstanding obligation is due. Advance payments are not allowed.';
  }

  if (weeksCount > payable.length) {
    return `Only ${payable.length} payable week(s) available; cannot allocate ${weeksCount}.`;
  }

  const oldestPayable = payable[0]!;
  const catchingUpMissedArrears = oldestPayable.status === 'MISSED';

  if (!catchingUpMissedArrears) {
    const referenceWeekday = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${input.referenceDate}T00:00:00.000Z`));

    const dueWeekday = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${oldestPayable.dueDate}T00:00:00.000Z`));

    const weekdayAllowed =
      normalizePaymentDay(referenceWeekday) === normalizePaymentDay(input.paymentDay) ||
      normalizePaymentDay(referenceWeekday) === normalizePaymentDay(dueWeekday) ||
      input.referenceDate === oldestPayable.dueDate;

    if (!weekdayAllowed) {
      return `Payments can only be recorded on the assigned payment day (${input.paymentDay}) or the scheduled due date after holiday adjustment (${oldestPayable.dueDate}).`;
    }
  }

  return undefined;
}

export function applyPaymentToSchedule(
  scheduleWeeks: ScheduleWeekDto[],
  referenceDate: string,
  weeksCount = 1,
): { weeks: ScheduleWeekDto[]; weekNumbers: number[]; weekNumber?: number } {
  const targetWeeks = getOldestPayableWeeks(scheduleWeeks, referenceDate, weeksCount);
  if (targetWeeks.length === 0) {
    return { weeks: scheduleWeeks, weekNumbers: [] };
  }

  const paidNumbers = new Set(targetWeeks.map((week) => week.weekNumber));
  return {
    weekNumber: targetWeeks[0]?.weekNumber,
    weekNumbers: targetWeeks.map((week) => week.weekNumber),
    weeks: scheduleWeeks.map((week) =>
      paidNumbers.has(week.weekNumber) ? { ...week, status: 'PAID' } : week,
    ),
  };
}

export type EscalationLevel = 'NONE' | 'DUE' | 'GRACE' | 'OVERDUE' | 'ESCALATED';

export function computeGraceAndEscalation(input: {
  referenceDate: string;
  oldestPayableDueDate?: string;
  graceDays: number;
}): {
  gracePeriodEnd?: string;
  daysPastDue: number;
  escalationLevel: EscalationLevel;
} {
  if (!input.oldestPayableDueDate) {
    return { daysPastDue: 0, escalationLevel: 'NONE' };
  }

  const dueMs = Date.parse(`${input.oldestPayableDueDate}T00:00:00.000Z`);
  const refMs = Date.parse(`${input.referenceDate}T00:00:00.000Z`);
  const daysPastDue = Math.max(0, Math.floor((refMs - dueMs) / 86_400_000));
  const gracePeriodEndMs = dueMs + input.graceDays * 86_400_000;
  const gracePeriodEnd = new Date(gracePeriodEndMs).toISOString().slice(0, 10);

  if (daysPastDue <= 0) {
    return { gracePeriodEnd, daysPastDue: 0, escalationLevel: 'DUE' };
  }
  if (daysPastDue <= input.graceDays) {
    return { gracePeriodEnd, daysPastDue, escalationLevel: 'GRACE' };
  }
  if (daysPastDue <= input.graceDays + 3) {
    return { gracePeriodEnd, daysPastDue, escalationLevel: 'OVERDUE' };
  }
  return { gracePeriodEnd, daysPastDue, escalationLevel: 'ESCALATED' };
}

export function countConsecutiveMissedWeeks(
  scheduleWeeks: ScheduleWeekDto[],
  referenceDate: string,
): number {
  const unpaid = getPayableWeeks(scheduleWeeks, referenceDate).filter(
    (week) => week.status === 'MISSED' || week.dueDate < referenceDate,
  );
  let count = 0;
  for (const week of unpaid) {
    if (week.status === 'MISSED' || week.dueDate < referenceDate) {
      count += 1;
    } else {
      break;
    }
  }
  return count;
}
