import { SCHEDULE_WEEK_STATUS, type LoanScheduleWeek } from '@/types/loan-schedule';
import { generateLoanSchedule } from '@/utils/loan-schedule';
import { applyMissedWeekAutoMarking } from '@/utils/schedule-missed-marking';

const SEED_LOAN_DEFINITIONS = [
  {
    id: 'loan-001',
    durationWeeks: 10,
    weeklyPaymentPesewas: 5000,
    startDate: '2026-05-01',
    paymentDay: 'Friday',
  },
  {
    id: 'loan-pending-001',
    durationWeeks: 12,
    weeklyPaymentPesewas: 2500,
    startDate: '2026-06-10',
    paymentDay: 'Monday',
  },
  {
    id: 'loan-completed-001',
    durationWeeks: 8,
    weeklyPaymentPesewas: 3000,
    startDate: '2025-11-01',
    paymentDay: 'Thursday',
  },
  {
    id: 'loan-002',
    durationWeeks: 12,
    weeklyPaymentPesewas: 4000,
    startDate: '2026-04-01',
    paymentDay: 'Tuesday',
  },
  {
    id: 'loan-003',
    durationWeeks: 10,
    weeklyPaymentPesewas: 3500,
    startDate: '2026-04-15',
    paymentDay: 'Wednesday',
  },
  {
    id: 'loan-004',
    durationWeeks: 16,
    weeklyPaymentPesewas: 6000,
    startDate: '2026-03-01',
    paymentDay: 'Friday',
  },
] as const;

function buildSeedSchedule(
  definition: (typeof SEED_LOAN_DEFINITIONS)[number],
  paidWeeks = 0,
): LoanScheduleWeek[] {
  const weeks = generateLoanSchedule({
    durationWeeks: definition.durationWeeks,
    weeklyPaymentPesewas: definition.weeklyPaymentPesewas,
    startDate: definition.startDate,
    paymentDay: definition.paymentDay,
  });

  return weeks.map((week, index) => ({
    ...week,
    status:
      index < paidWeeks ? SCHEDULE_WEEK_STATUS.PAID : SCHEDULE_WEEK_STATUS.PENDING,
  }));
}

function buildSeedScheduleWithMissedWeeks(
  definition: (typeof SEED_LOAN_DEFINITIONS)[number],
  paidWeeks: number,
  missedWeekIndexes: number[],
): LoanScheduleWeek[] {
  const weeks = buildSeedSchedule(definition, paidWeeks);

  return weeks.map((week, index) =>
    missedWeekIndexes.includes(index)
      ? { ...week, status: SCHEDULE_WEEK_STATUS.MISSED }
      : week,
  );
}

const seedSchedules: Record<string, LoanScheduleWeek[]> = {
  'loan-001': buildSeedSchedule(SEED_LOAN_DEFINITIONS[0], 3),
  'loan-pending-001': buildSeedSchedule(SEED_LOAN_DEFINITIONS[1]),
  'loan-completed-001': buildSeedSchedule(SEED_LOAN_DEFINITIONS[2], 8),
  'loan-002': buildSeedScheduleWithMissedWeeks(SEED_LOAN_DEFINITIONS[3], 4, [4]),
  'loan-003': buildSeedScheduleWithMissedWeeks(SEED_LOAN_DEFINITIONS[4], 3, [3, 4]),
  'loan-004': buildSeedSchedule(SEED_LOAN_DEFINITIONS[5], 6),
};

let loanSchedules: Record<string, LoanScheduleWeek[]> = { ...seedSchedules };

function syncMissedWeeksForLoan(loanId: string, referenceDate: string): LoanScheduleWeek[] | undefined {
  const weeks = loanSchedules[loanId];

  if (!weeks) {
    return undefined;
  }

  const synced = applyMissedWeekAutoMarking(weeks, referenceDate);
  const changed = synced.some((week, index) => week.status !== weeks[index]?.status);

  if (changed) {
    loanSchedules = {
      ...loanSchedules,
      [loanId]: synced,
    };
  }

  void import('@/services/mock/borrower-escalation.sync').then((module) => {
    void module.syncBorrowerAndLoanEscalation(loanId, synced);
  });

  void import('@/services/mock/payment-reminder.sync').then((module) => {
    void module.syncPaymentReminders({ loanId, weeks: synced, referenceDate });
  });

  return synced;
}

export function getStoredLoanSchedule(
  loanId: string,
  referenceDate?: string,
): LoanScheduleWeek[] | undefined {
  const date = referenceDate ?? new Date().toISOString().slice(0, 10);
  return syncMissedWeeksForLoan(loanId, date);
}

export function saveLoanSchedule(loanId: string, weeks: LoanScheduleWeek[]): void {
  loanSchedules = {
    ...loanSchedules,
    [loanId]: weeks,
  };
}

export function resetLoanSchedules(): void {
  loanSchedules = {
    'loan-001': buildSeedSchedule(SEED_LOAN_DEFINITIONS[0], 3),
    'loan-pending-001': buildSeedSchedule(SEED_LOAN_DEFINITIONS[1]),
    'loan-completed-001': buildSeedSchedule(SEED_LOAN_DEFINITIONS[2], 8),
    'loan-002': buildSeedScheduleWithMissedWeeks(SEED_LOAN_DEFINITIONS[3], 4, [4]),
    'loan-003': buildSeedScheduleWithMissedWeeks(SEED_LOAN_DEFINITIONS[4], 3, [3, 4]),
    'loan-004': buildSeedSchedule(SEED_LOAN_DEFINITIONS[5], 6),
  };
}
