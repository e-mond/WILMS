import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoanScheduleTable } from '@/components/data-display/LoanScheduleTable';
import { SCHEDULE_WEEK_STATUS } from '@/types/loan-schedule';

describe('LoanScheduleTable', () => {
  it('renders week-by-week schedule rows with status badges', () => {
    render(
      <LoanScheduleTable
        weeks={[
          {
            weekNumber: 1,
            dueDate: '2026-06-15',
            amountPesewas: 2500,
            status: SCHEDULE_WEEK_STATUS.PENDING,
          },
          {
            weekNumber: 2,
            dueDate: '2026-06-22',
            amountPesewas: 2500,
            status: SCHEDULE_WEEK_STATUS.PAID,
          },
        ]}
      />,
    );

    expect(screen.getByText('Week 1')).toBeInTheDocument();
    expect(screen.getByText('Week 2')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getAllByText('GH₵25.00')).toHaveLength(2);
  });
});
