'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CurrencyAmount,
  KpiCard,
  LoanScheduleTable,
  LoanStatusBadge,
} from '@/components/data-display';
import { DetailSidebarCard, ExecutiveKpiGrid } from '@/components/layout/executive';
import { ExecutiveDetailLayout } from '@/components/layout/ExecutiveDetailLayout';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import { LoanPaymentLogTable } from '@/features/loan-management/components/LoanPaymentLogTable';
import { LoanProgressMetrics } from '@/features/loan-management/components/LoanProgressMetrics';
import { useDisburseLoan } from '@/features/loan-management/hooks/useDisburseLoan';
import { useLoanPaymentLog } from '@/features/loan-management/hooks/useLoanPaymentLog';
import { useLoanProgress } from '@/features/loan-management/hooks/useLoanProgress';
import { useLoanSchedule } from '@/features/loan-management/hooks/useLoanSchedule';
import { PERMISSION } from '@/constants/permissions';
import { loanService } from '@/services';
import { LOAN_STATUS } from '@/types/loan';
import { resolveLoanDisplayId } from '@/utils/entity-display-id';
import { formatDisplayDate } from '@/utils/format-date';

export interface LoanDetailPanelProps {
  loanId: string;
}

export function LoanDetailPanel({ loanId }: LoanDetailPanelProps) {
  const {
    data: loan,
    isLoading: isLoanLoading,
    isError: isLoanError,
    refetch: refetchLoan,
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
  const {
    data: paymentLog,
    isLoading: isPaymentLogLoading,
    isError: isPaymentLogError,
    refetch: refetchPaymentLog,
  } = useLoanPaymentLog(loanId);

  const disburseLoan = useDisburseLoan(loanId);

  if (isLoanLoading || isScheduleLoading || isProgressLoading || isPaymentLogLoading) {
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

  const loanLabel = resolveLoanDisplayId(loan);
  const isPendingDisbursement = loan.status === LOAN_STATUS.PENDING_DISBURSEMENT;

  return (
    <div className="space-y-wilms-4">
      <div className="flex flex-wrap items-start justify-between gap-wilms-3">
        <div>
          <h1 className="text-heading-1 font-semibold text-text-primary">{loanLabel}</h1>
          <p className="mt-wilms-1 text-body text-text-muted">
            {loan.cycleBatch} · {loan.paymentDay}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-wilms-2">
          <LoanStatusBadge status={loan.status} />
          {isPendingDisbursement ? (
            <PermissionGate permission={PERMISSION.APPROVE_LOANS}>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={disburseLoan.isPending}
                onClick={() => void disburseLoan.mutateAsync().then(() => {
                  void refetchLoan();
                  void refetchPaymentLog();
                })}
              >
                {disburseLoan.isPending ? 'Disbursing…' : 'Disburse loan'}
              </Button>
            </PermissionGate>
          ) : null}
        </div>
      </div>

      {isPendingDisbursement ? (
        <p className="rounded-sm border border-border bg-card px-wilms-4 py-wilms-3 text-body text-text-secondary">
          This loan is pending disbursement. Confirm admin fee collection, then disburse to activate
          the weekly repayment schedule.
        </p>
      ) : null}

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
        <section className="space-y-wilms-6">
          <LoanProgressMetrics progress={progress} />
          <div>
            <h2 className="text-heading-2 font-semibold text-text-primary">Weekly schedule</h2>
            <p className="mt-wilms-1 text-body text-text-muted">
              {schedule.weeks.length} installments from Week 1 to Week {schedule.weeks.length}.
            </p>
          </div>
          <LoanScheduleTable weeks={schedule.weeks} />
          <div>
            <h2 className="text-heading-2 font-semibold text-text-primary">Transactions</h2>
            <p className="mt-wilms-1 text-body text-text-muted">
              Disbursements and confirmed repayments from the transaction ledger.
            </p>
          </div>
          <LoanPaymentLogTable entries={paymentLog} detailed />
        </section>
      </ExecutiveDetailLayout>
    </div>
  );
}
