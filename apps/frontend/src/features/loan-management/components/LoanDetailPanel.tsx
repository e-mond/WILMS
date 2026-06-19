'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CurrencyAmount, KpiCard, LoanScheduleTable } from '@/components/data-display';
import { DetailSidebarCard, ExecutiveKpiGrid } from '@/components/layout/executive';
import { ExecutiveDetailLayout } from '@/components/layout/ExecutiveDetailLayout';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { LoanProgressMetrics } from '@/features/loan-management/components/LoanProgressMetrics';
import { useLoanProgress } from '@/features/loan-management/hooks/useLoanProgress';
import { useLoanSchedule } from '@/features/loan-management/hooks/useLoanSchedule';
import { loanService } from '@/services';
import { formatDisplayDate } from '@/utils/format-date';

export interface LoanDetailPanelProps {
  loanId: string;
}

export function LoanDetailPanel({ loanId }: LoanDetailPanelProps) {
  const {
    data: loan,
    isLoading: isLoanLoading,
    isError: isLoanError,
  } = useQuery({
    queryKey: ['loans', loanId],
    queryFn: () => loanService.getLoan(loanId),
  });

  const {
    data: schedule,
    isLoading: isScheduleLoading,
    isError: isScheduleError,
  } = useLoanSchedule(loanId);
  const {
    data: progress,
    isLoading: isProgressLoading,
    isError: isProgressError,
  } = useLoanProgress(loanId);

  if (isLoanLoading || isScheduleLoading || isProgressLoading) {
    return <LoadingSpinner label="Loading loan details" className="py-wilms-8" />;
  }

  if (isLoanError || isScheduleError || isProgressError || !loan || !schedule || !progress) {
    return (
      <EmptyState
        title="Loan not found"
        description="This loan or its schedule could not be loaded."
        action={
          <Link
            href="/loans"
            className="text-small font-semibold text-brand-primary hover:underline"
          >
            Back to loans
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-wilms-4">
      <h1 className="text-heading-1 font-semibold text-text-primary">{loan.id}</h1>

      <ExecutiveKpiGrid>
        <KpiCard
          variant="executive"
          label="Loan amount"
          value={<CurrencyAmount value={loan.amountPesewas} />}
        />
        <KpiCard
          variant="executive"
          label="Outstanding"
          value={<CurrencyAmount value={loan.outstandingPesewas} />}
        />
        <KpiCard
          variant="executive"
          label="Weekly payment"
          value={<CurrencyAmount value={loan.weeklyPaymentPesewas} />}
        />
        <KpiCard variant="executive" label="Duration" value={`${loan.durationWeeks} weeks`} />
      </ExecutiveKpiGrid>

      <ExecutiveDetailLayout
        sidebar={
          <DetailSidebarCard title="Loan details">
            <dl className="space-y-wilms-3 text-small">
              {[
                ['Status', loan.status.replaceAll('_', ' ')],
                ['Payment day', loan.paymentDay],
                ['Start date', formatDisplayDate(loan.startDate)],
                ['Cycle / batch', loan.cycleBatch],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="font-semibold text-text-muted">{label}</dt>
                  <dd className="text-text-primary">{value}</dd>
                </div>
              ))}
            </dl>
          </DetailSidebarCard>
        }
      >
        <section className="space-y-wilms-4">
          <LoanProgressMetrics progress={progress} />
          <div>
            <h2 className="text-heading-2 font-semibold text-text-primary">Weekly schedule</h2>
            <p className="mt-wilms-1 text-body text-text-muted">
              {schedule.weeks.length} installments from Week 1 to Week {schedule.weeks.length}.
            </p>
          </div>
          <LoanScheduleTable weeks={schedule.weeks} />
        </section>
      </ExecutiveDetailLayout>
    </div>
  );
}
