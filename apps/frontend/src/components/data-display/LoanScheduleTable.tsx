import { Badge } from '@/components/ui/Badge';
import { CurrencyAmount } from '@/components/data-display/CurrencyAmount';
import { SCHEDULE_WEEK_STATUS_DISPLAY } from '@/constants/loan-schedule';
import type { LoanScheduleWeek } from '@/types/loan-schedule';
import { formatDisplayDate } from '@/utils/format-date';
import { cn } from '@/utils/cn';

export interface LoanScheduleTableProps {
  weeks: LoanScheduleWeek[];
  className?: string;
}

export function LoanScheduleTable({ weeks, className }: LoanScheduleTableProps) {
  return (
    <div
      role="region"
      aria-label="Weekly loan repayment schedule"
      tabIndex={0}
      className={cn('overflow-x-auto rounded-sm border border-border bg-card', className)}
    >
      <table className="min-w-full border-collapse text-left text-body">
        <caption className="sr-only">Weekly loan repayment schedule</caption>
        <thead className="border-b border-border bg-background">
          <tr>
            <th scope="col" className="px-wilms-4 py-wilms-3 text-small font-semibold text-text-muted">
              Week
            </th>
            <th scope="col" className="px-wilms-4 py-wilms-3 text-small font-semibold text-text-muted">
              Due date
            </th>
            <th scope="col" className="px-wilms-4 py-wilms-3 text-small font-semibold text-text-muted">
              Amount
            </th>
            <th scope="col" className="px-wilms-4 py-wilms-3 text-small font-semibold text-text-muted">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => {
            const statusDisplay = SCHEDULE_WEEK_STATUS_DISPLAY[week.status];

            return (
              <tr key={week.weekNumber} className="border-b border-border last:border-b-0">
                <td className="px-wilms-4 py-wilms-3 font-semibold text-text-primary">
                  Week {week.weekNumber}
                </td>
                <td className="px-wilms-4 py-wilms-3 text-text-primary">
                  {formatDisplayDate(week.dueDate)}
                </td>
                <td className="px-wilms-4 py-wilms-3">
                  <CurrencyAmount value={week.amountPesewas} />
                </td>
                <td className="px-wilms-4 py-wilms-3">
                  <Badge variant={statusDisplay.variant}>{statusDisplay.label}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
