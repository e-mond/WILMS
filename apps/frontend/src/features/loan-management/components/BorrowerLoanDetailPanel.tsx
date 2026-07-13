'use client';

import Link from 'next/link';
import { resolveLoanDisplayId } from '@/utils/entity-display-id';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CurrencyAmount,
  LoanScheduleTable,
  LoanStatusBadge,
} from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { LoanPaymentLogTable } from '@/features/loan-management/components/LoanPaymentLogTable';
import { LoanProgressMetrics } from '@/features/loan-management/components/LoanProgressMetrics';
import { useLoanPaymentLog } from '@/features/loan-management/hooks/useLoanPaymentLog';
import { useLoanProgress } from '@/features/loan-management/hooks/useLoanProgress';
import { useLoanSchedule } from '@/features/loan-management/hooks/useLoanSchedule';
import { useBorrowerLoans } from '@/features/borrower-management/hooks/useBorrowerLoans';
import { loanService } from '@/services';
import { LOAN_STATUS } from '@/types/loan';
import { formatDisplayDate } from '@/utils/format-date';

export interface BorrowerLoanDetailPanelProps {
  borrowerId: string;
  loanId?: string;
}

function resolveLoanId(
  requestedLoanId: string | undefined,
  loans: { id: string; status: string }[],
): string | undefined {
  if (requestedLoanId && loans.some((loan) => loan.id === requestedLoanId)) {
    return requestedLoanId;
  }

  const activeLoan = loans.find((loan) => loan.status === LOAN_STATUS.ACTIVE);
  return activeLoan?.id ?? loans[0]?.id;
}

export function BorrowerLoanDetailPanel({ borrowerId, loanId }: BorrowerLoanDetailPanelProps) {
  const { data: loans, isLoading: isLoansLoading, isError: isLoansError } = useBorrowerLoans(borrowerId);

  const resolvedLoanId = useMemo(
    () => resolveLoanId(loanId, loans ?? []),
    [loanId, loans],
  );

  const {
    data: loan,
    isLoading: isLoanLoading,
    isError: isLoanError,
  } = useQuery({
    queryKey: ['loans', resolvedLoanId],
    queryFn: () => loanService.getLoan(resolvedLoanId!),
    enabled: Boolean(resolvedLoanId),
  });

  const {
    data: schedule,
    isLoading: isScheduleLoading,
    isError: isScheduleError,
  } = useLoanSchedule(resolvedLoanId ?? '');
  const {
    data: progress,
    isLoading: isProgressLoading,
    isError: isProgressError,
  } = useLoanProgress(resolvedLoanId ?? '');
  const {
    data: paymentLog,
    isLoading: isPaymentLogLoading,
    isError: isPaymentLogError,
  } = useLoanPaymentLog(resolvedLoanId ?? '');

  if (isLoansLoading) {
    return <LoadingSpinner label="Loading borrower loans" className="py-wilms-8" />;
  }

  if (isLoansError || !loans?.length || !resolvedLoanId) {
    return (
      <EmptyState
        title="No loan to display"
        description="This borrower does not have any loans yet."
        action={
          <Link
            href={`/borrowers/${borrowerId}`}
            className="text-small font-semibold text-brand-primary hover:underline"
          >
            Back to borrower profile
          </Link>
        }
      />
    );
  }

  if (
    isLoanLoading ||
    isScheduleLoading ||
    isProgressLoading ||
    isPaymentLogLoading
  ) {
    return <LoadingSpinner label="Loading loan details" className="py-wilms-8" />;
  }

  if (
    isLoanError ||
    isScheduleError ||
    isProgressError ||
    isPaymentLogError ||
    !loan ||
    !schedule ||
    !progress ||
    !paymentLog
  ) {
    return (
      <EmptyState
        title="Loan not found"
        description="This loan or its related data could not be loaded."
        action={
          <Link
            href={`/borrowers/${borrowerId}`}
            className="text-small font-semibold text-brand-primary hover:underline"
          >
            Back to borrower profile
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-wilms-6">
      <div>
        <Link
          href={`/borrowers/${borrowerId}`}
          className="text-small font-semibold text-brand-primary hover:underline"
        >
          Back to borrower profile
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-wilms-3">
        <h1 className="text-heading-1 font-semibold text-text-primary">{resolveLoanDisplayId(loan)}</h1>
        <LoanStatusBadge status={loan.status} />
      </div>

      <section className="rounded-sm border border-border bg-card p-wilms-4">
        <h2 className="text-heading-3 font-semibold text-text-primary">Loan terms</h2>
        <dl className="mt-wilms-3 grid gap-wilms-3 md:grid-cols-2 lg:grid-cols-3">
          {[
            ['Loan amount', <CurrencyAmount key="amount" value={loan.amountPesewas} />],
            ['Weekly payment', <CurrencyAmount key="weekly" value={loan.weeklyPaymentPesewas} />],
            ['Duration', `${loan.durationWeeks} weeks`],
            ['Payment day', loan.paymentDay],
            ['Start date', formatDisplayDate(loan.startDate)],
            ['Cycle / batch', loan.cycleBatch],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <dt className="text-small font-semibold text-text-muted">{label}</dt>
              <dd className="text-body text-text-primary">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-wilms-3">
        <h2 className="text-heading-2 font-semibold text-text-primary">Progress metrics</h2>
        <LoanProgressMetrics progress={progress} />
      </section>

      <section className="space-y-wilms-3">
        <div>
          <h2 className="text-heading-2 font-semibold text-text-primary">Weekly schedule</h2>
          <p className="mt-wilms-1 text-body text-text-muted">
            {schedule.weeks.length} installments from Week 1 to Week {schedule.weeks.length}.
          </p>
        </div>
        <LoanScheduleTable weeks={schedule.weeks} />
      </section>

      <section className="space-y-wilms-3">
        <div>
          <h2 className="text-heading-2 font-semibold text-text-primary">Payment log</h2>
          <p className="mt-wilms-1 text-body text-text-muted">
            Disbursements and confirmed repayments from the transaction ledger.
          </p>
        </div>
        <LoanPaymentLogTable entries={paymentLog} />
      </section>
    </div>
  );
}
