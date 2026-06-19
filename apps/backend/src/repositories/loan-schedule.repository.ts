import { and, eq } from 'drizzle-orm';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { loanSchedules } from '../db/schema/loan-schedules.js';
import { pesewasToDecimal } from '../domain/money.js';
import type { ScheduleWeekDraft } from '../domain/loan/schedule.js';

export async function insertScheduleWeeks(
  loanId: string,
  weeks: ScheduleWeekDraft[],
  tx: WilmsDb = getDb(),
) {
  if (weeks.length === 0) {
    return;
  }

  await tx.insert(loanSchedules).values(
    weeks.map((week) => ({
      loanId,
      weekNumber: week.weekNumber,
      dueDate: week.dueDate,
      installmentAmount: pesewasToDecimal(week.amountPesewas),
      status: week.status,
    })),
  );
}

export async function listScheduleWeeks(loanId: string, tx: WilmsDb = getDb()) {
  return tx
    .select()
    .from(loanSchedules)
    .where(eq(loanSchedules.loanId, loanId))
    .orderBy(loanSchedules.weekNumber);
}

export async function markWeekPaid(
  input: {
    loanId: string;
    weekNumber: number;
    expectedVersion: number;
  },
  tx: WilmsDb = getDb(),
) {
  const result = await tx
    .update(loanSchedules)
    .set({
      status: 'PAID',
      paidAt: new Date(),
      updatedAt: new Date(),
      version: input.expectedVersion + 1,
    })
    .where(
      and(
        eq(loanSchedules.loanId, input.loanId),
        eq(loanSchedules.weekNumber, input.weekNumber),
        eq(loanSchedules.version, input.expectedVersion),
      ),
    )
    .returning();

  if (result.length === 0) {
    throw new Error('CONFLICT:Schedule week was modified by another request.');
  }

  return result[0]!;
}

export async function applyMissedWeekMarking(
  loanId: string,
  referenceDate: string,
  tx: WilmsDb = getDb(),
) {
  const weeks = await listScheduleWeeks(loanId, tx);

  for (const week of weeks) {
    if (week.status === 'PENDING' && week.dueDate < referenceDate) {
      await tx
        .update(loanSchedules)
        .set({ status: 'MISSED', updatedAt: new Date(), version: week.version + 1 })
        .where(
          and(
            eq(loanSchedules.loanId, loanId),
            eq(loanSchedules.weekNumber, week.weekNumber),
            eq(loanSchedules.version, week.version),
          ),
        );
    }
  }
}
