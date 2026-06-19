export const SCHEDULE_WEEK_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  MISSED: 'MISSED',
  OVERDUE: 'OVERDUE',
} as const;

export type ScheduleWeekStatus =
  (typeof SCHEDULE_WEEK_STATUS)[keyof typeof SCHEDULE_WEEK_STATUS];

export interface LoanScheduleWeek {
  weekNumber: number;
  dueDate: string;
  amountPesewas: number;
  status: ScheduleWeekStatus;
}

export interface LoanSchedule {
  loanId: string;
  weeks: LoanScheduleWeek[];
}
