import * as scheduleRepo from '../../repositories/loan-schedule.repository.js';
import type { loans } from '../../db/schema/loans.js';
import { decimalToPesewas } from '../money.js';

export async function refreshLoanScheduleState(input: {
  loan: typeof loans.$inferSelect;
  referenceDate: string;
  graceDays: number;
  allowLoanRollovers: boolean;
  holidayDates?: Iterable<string>;
}): Promise<void> {
  await scheduleRepo.applyMissedWeekMarking(
    input.loan.id,
    input.referenceDate,
    input.graceDays,
  );
  await scheduleRepo.ensureMissedPaymentRolloverWeeks(input.loan.id, {
    durationWeeks: input.loan.durationWeeks,
    weeklyPaymentPesewas: decimalToPesewas(input.loan.installmentAmount),
    allowRollovers: input.allowLoanRollovers,
    holidayDates: input.holidayDates,
  });
}
