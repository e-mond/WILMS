import { CurrencyAmount, LoanScheduleTable } from '@/components/data-display';
import {
  calculateWeeklyPaymentPesewas,
  parseGhsToPesewas,
} from '@/features/loan-management/loan.utils';
import type { CreateLoanFormValues, LoanEligibleBorrower } from '@/types/loan';
import { generateLoanSchedule } from '@/utils/loan-schedule';
import { formatDisplayDate } from '@/utils/format-date';

export interface LoanPreviewProps {
  values: CreateLoanFormValues;
  borrower?: LoanEligibleBorrower;
}

export function LoanPreview({ values, borrower }: LoanPreviewProps) {
  const amountPesewas = parseGhsToPesewas(values.amountGhs) ?? 0;
  const weeklyPaymentPesewas = calculateWeeklyPaymentPesewas(
    amountPesewas,
    values.durationWeeks,
  );

  const projectedSchedule =
    values.startDate && values.paymentDay && values.durationWeeks > 0 && amountPesewas > 0
      ? generateLoanSchedule({
          durationWeeks: values.durationWeeks,
          weeklyPaymentPesewas,
          startDate: values.startDate,
          paymentDay: values.paymentDay,
        })
      : [];

  return (
    <div className="space-y-wilms-6">
      <section className="space-y-wilms-4 rounded-sm border border-border bg-card p-wilms-4">
        <h2 className="text-heading-2 font-semibold text-text-primary">Review loan</h2>
        <p className="text-body text-text-muted">
          Confirm every detail before creating this loan. The loan will be saved as pending
          disbursement.
        </p>
        <dl className="grid gap-wilms-3 md:grid-cols-2">
          {[
            ['Borrower', borrower?.fullName ?? '—'],
            ['Phone', borrower?.phone ?? '—'],
            ['Community', borrower?.community ?? '—'],
            ['Group', borrower?.groupName ?? '—'],
            ['Loan amount', <CurrencyAmount key="amount" value={amountPesewas} />],
            ['Duration', `${values.durationWeeks} weeks`],
            [
              'Weekly payment',
              <CurrencyAmount key="weekly" value={weeklyPaymentPesewas} />,
            ],
            ['Payment day', values.paymentDay || '—'],
            ['Cycle / batch', values.cycleBatch || '—'],
            ['Start date', values.startDate ? formatDisplayDate(values.startDate) : '—'],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <dt className="text-small font-semibold text-text-muted">{label}</dt>
              <dd className="text-body text-text-primary">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {projectedSchedule.length > 0 ? (
        <section className="space-y-wilms-3">
          <div>
            <h3 className="text-heading-3 font-semibold text-text-primary">Schedule preview</h3>
            <p className="mt-wilms-1 text-body text-text-muted">
              {projectedSchedule.length} weekly installments will be generated on submission.
            </p>
          </div>
          <LoanScheduleTable weeks={projectedSchedule} />
        </section>
      ) : null}
    </div>
  );
}
