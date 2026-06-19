import { SCHEDULE_WEEK_STATUS, type ScheduleWeekStatus } from '@/types/loan-schedule';
import type { BadgeVariant } from '@/components/ui/Badge';

export const SCHEDULE_WEEK_STATUS_DISPLAY: Record<
  ScheduleWeekStatus,
  { label: string; variant: BadgeVariant }
> = {
  [SCHEDULE_WEEK_STATUS.PENDING]: { label: 'Pending', variant: 'pending' },
  [SCHEDULE_WEEK_STATUS.PAID]: { label: 'Paid', variant: 'success' },
  [SCHEDULE_WEEK_STATUS.MISSED]: { label: 'Missed', variant: 'danger' },
  [SCHEDULE_WEEK_STATUS.OVERDUE]: { label: 'Overdue', variant: 'danger' },
};

export const PAYMENT_DAY_TO_JS_DAY: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};
