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

/**
 * Reverts a PAID schedule week after payment reversal.
 * Status: MISSED if due date is before reference date, otherwise PENDING (per B-ARCH-03).
 */
export async function revertWeekPaid(
  input: {
    loanId: string;
    weekNumber: number;
    expectedVersion: number;
    referenceDate: string;
  },
  tx: WilmsDb = getDb(),
) {
  const [week] = await tx
    .select()
    .from(loanSchedules)
    .where(
      and(eq(loanSchedules.loanId, input.loanId), eq(loanSchedules.weekNumber, input.weekNumber)),
    )
    .limit(1);

  if (!week || week.status !== 'PAID') {
    throw new Error('VALIDATION:Schedule week is not in a reversible PAID state.');
  }

  const restoredStatus = week.dueDate < input.referenceDate ? 'MISSED' : 'PENDING';

  const result = await tx
    .update(loanSchedules)
    .set({
      status: restoredStatus,
      paidAt: null,
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

function addGraceDays(isoDate: string, graceDays: number): string {
  if (graceDays <= 0) {
    return isoDate;
  }
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + graceDays);
  return date.toISOString().slice(0, 10);
}

export async function applyMissedWeekMarking(
  loanId: string,
  referenceDate: string,
  graceDays = 0,
  tx: WilmsDb = getDb(),
): Promise<number[]> {
  const weeks = await listScheduleWeeks(loanId, tx);
  const newlyMissed: number[] = [];

  for (const week of weeks) {
    const missedThreshold = addGraceDays(week.dueDate, graceDays);
    if (week.status === 'PENDING' && missedThreshold < referenceDate) {
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
      newlyMissed.push(week.weekNumber);
    }
  }

  return newlyMissed;
}
