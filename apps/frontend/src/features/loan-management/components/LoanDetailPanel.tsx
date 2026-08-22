'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CurrencyAmount,
  KpiCard,
  LoanScheduleTable,
  LoanStatusBadge,
  TimelineStepper,
} from '@/components/data-display';
import { DetailSidebarCard, ExecutiveKpiGrid } from '@/components/layout/executive';
import { ExecutiveDetailLayout } from '@/components/layout/ExecutiveDetailLayout';
import { EmptyState } from '@/components/feedback/EmptyState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import { useDisbursementEligibility } from '@/features/admin-fee/hooks/useDisbursementEligibility';
import { LoanPaymentLogTable } from '@/features/loan-management/components/LoanPaymentLogTable';
import { LoanProgressMetrics } from '@/features/loan-management/components/LoanProgressMetrics';
import { useApproveLoan } from '@/features/loan-management/hooks/useApproveLoan';
import { useDisburseLoan } from '@/features/loan-management/hooks/useDisburseLoan';
import { useLoanPaymentLog } from '@/features/loan-management/hooks/useLoanPaymentLog';
import { useLoanProgress } from '@/features/loan-management/hooks/useLoanProgress';
import { useLoanSchedule } from '@/features/loan-management/hooks/useLoanSchedule';
import {
  buildLoanWorkflowSteps,
  canApproveLoan,
  canDisburseLoan,
  workflowActionHint,
} from '@/features/loan-management/utils/loan-workflow-steps';
import { PERMISSION } from '@/constants/permissions';
import { loanService } from '@/services';
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

  const approveLoan = useApproveLoan(loanId);
  const disburseLoan = useDisburseLoan(loanId);

  const needsWorkflowGate =
    !!loan &&
    (canApproveLoan(loan.lifecycleStatus) ||
      canDisburseLoan(loan.lifecycleStatus) ||
      loan.status === 'PENDING_DISBURSEMENT');

  const { data: eligibility } = useDisbursementEligibility(
    loan?.borrowerId ?? '',
    Boolean(loan?.borrowerId) && needsWorkflowGate,
  );

  if (isLoanLoading || isScheduleLoading || isProgressLoading || isPaymentLogLoading) {
    return <InlinePanelSkeleton />;
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
  const adminFeePaid = eligibility ? eligibility.canDisburse || !eligibility.reason?.includes('Admin fee') : false;
  // Prefer explicit eligibility: canDisburse true means fee + pending lifecycle; if reason is about approval only, fee is paid
  const feeSatisfied =
    eligibility == null
      ? false
      : eligibility.canDisburse
        ? true
        : eligibility.reason?.toLowerCase().includes('admin fee')
          ? false
          : true;

  const showApprove = canApproveLoan(loan.lifecycleStatus);
  const showDisburse = canDisburseLoan(loan.lifecycleStatus);
  const disburseEnabled = showDisburse && feeSatisfied && (eligibility?.canDisburse ?? false);
  const workflowSteps = buildLoanWorkflowSteps({
    lifecycleStatus: loan.lifecycleStatus,
    status: loan.status,
    adminFeePaid: feeSatisfied || adminFeePaid,
  });
  const actionHint = workflowActionHint({
    lifecycleStatus: loan.lifecycleStatus,
    adminFeePaid: feeSatisfied,
    canDisburseEligibility: eligibility?.canDisburse,
  });

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
          {showApprove ? (
            <PermissionGate permission={PERMISSION.APPROVE_LOANS}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={approveLoan.isPending}
                onClick={() =>
                  void approveLoan.mutateAsync().then(() => {
                    void refetchLoan();
                  })
                }
              >
                {approveLoan.isPending ? 'Approving…' : 'Approve loan'}
              </Button>
            </PermissionGate>
          ) : null}
          {showDisburse ? (
            <PermissionGate permission={PERMISSION.APPROVE_LOANS}>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={disburseLoan.isPending || !disburseEnabled}
                onClick={() =>
                  void disburseLoan.mutateAsync().then(() => {
                    void refetchLoan();
                    void refetchPaymentLog();
                  })
                }
              >
                {disburseLoan.isPending ? 'Disbursing…' : 'Disburse loan'}
              </Button>
            </PermissionGate>
          ) : null}
        </div>
      </div>

      <section
        className="rounded-sm border border-border bg-card px-wilms-4 py-wilms-4"
        aria-label="Loan workflow"
      >
        <h2 className="text-heading-2 font-semibold text-text-primary">Workflow status</h2>
        {actionHint ? (
          <p className="mt-wilms-1 text-body text-text-secondary">{actionHint}</p>
        ) : null}
        <div className="mt-wilms-3">
          <TimelineStepper steps={workflowSteps} />
        </div>
      </section>

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
                [
                  'Lifecycle',
                  (loan.lifecycleStatus ?? '—').toString().replaceAll('_', ' '),
                ],
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
