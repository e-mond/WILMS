'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  Avatar,
  CurrencyAmount,
  DataTable,
  KpiCard,
  LoanScheduleTable,
  LoanStatusBadge,
  StatusBadge,
} from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { ExecutiveKpiGrid } from '@/components/layout/executive';
import { ProfileFieldGrid, ProfileSection } from '@/components/layout/executive/ProfileSection';
import { DetailSidebarCard } from '@/components/layout/executive';
import { LoanPaymentLogTable } from '@/features/loan-management/components/LoanPaymentLogTable';
import { LoanProgressMetrics } from '@/features/loan-management/components/LoanProgressMetrics';
import { BorrowerProfileActions } from '@/features/borrower-management/components/BorrowerProfileActions';
import { useBorrowerFullProfile } from '@/features/borrower-management/hooks/useBorrowerFullProfile';
import { useBorrowerLoans } from '@/features/borrower-management/hooks/useBorrowerLoans';
import { useLoanPaymentLog } from '@/features/loan-management/hooks/useLoanPaymentLog';
import { useLoanProgress } from '@/features/loan-management/hooks/useLoanProgress';
import { useLoanSchedule } from '@/features/loan-management/hooks/useLoanSchedule';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { LOAN_STATUS } from '@/types/loan';
import { formatDisplayDate } from '@/utils/format-date';
import { resolveBorrowerDisplayId } from '@/utils/format-borrower-display-id';
import { resolveBorrowerRisk } from '@/utils/borrower-risk';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';
import { resolveLoanDisplayId } from '@/utils/entity-display-id';

export interface BorrowerProfilePanelProps {
  borrowerId: string;
}

function resolveActiveLoanId(
  loans: { id: string; status: string }[],
): string | undefined {
  return loans.find((loan) => loan.status === LOAN_STATUS.ACTIVE)?.id ?? loans[0]?.id;
}

export function BorrowerProfilePanel({ borrowerId }: BorrowerProfilePanelProps) {
  const { data: borrower, isLoading, isError, error, refetch } = useBorrowerFullProfile(borrowerId);
  const { data: loans, isLoading: isLoansLoading } = useBorrowerLoans(borrowerId);
  const activeLoanId = useMemo(() => resolveActiveLoanId(loans ?? []), [loans]);
  const { data: schedule } = useLoanSchedule(activeLoanId ?? '');
  const { data: progress } = useLoanProgress(activeLoanId ?? '');
  const { data: paymentLog } = useLoanPaymentLog(activeLoanId ?? '');

  const asideContent = useMemo(() => {
    if (!borrower) {
      return null;
    }

    const activeLoan = loans?.find((loan) => loan.id === activeLoanId);
    const risk = resolveBorrowerRisk(borrower.risk);

    return (
      <>
        <DetailSidebarCard title="Borrower Summary">
          <div className="mt-wilms-3 space-y-wilms-3">
            <Avatar
              label={borrower.fullName}
              photoUrl={resolveEntityPhotoUrl({
                name: borrower.fullName,
                id: borrower.id,
                photoUrl: borrower.photoUrl,
              })}
              size="lg"
            />
            <StatusBadge status={borrower.status} />
            <p className="text-small text-text-muted">{resolveBorrowerDisplayId(borrower)}</p>
          </div>
        </DetailSidebarCard>
        <DetailSidebarCard title="Quick Actions">
          <div className="mt-wilms-3 flex flex-col gap-wilms-2">
            {borrower.groupId ? (
              <Link
                href={`/groups/${borrower.groupId}`}
                className="inline-flex h-8 items-center justify-center rounded-sm border border-brand-primary bg-brand-primary px-wilms-3 text-small font-semibold text-card hover:opacity-90"
              >
                View Group
              </Link>
            ) : null}
            {activeLoanId ? (
              <Link
                href={`/borrowers/${borrowerId}/loan?loanId=${activeLoanId}`}
                className="inline-flex h-8 items-center justify-center rounded-sm border border-border px-wilms-3 text-small font-semibold text-text-primary hover:bg-background"
              >
                Loan Detail View
              </Link>
            ) : null}
            <Link
              href="/borrowers"
              className="inline-flex h-8 items-center justify-center rounded-sm border border-border px-wilms-3 text-small font-semibold text-text-muted hover:bg-background"
            >
              Back to Borrowers
            </Link>
          </div>
        </DetailSidebarCard>
        {activeLoan ? (
          <DetailSidebarCard title="Active Loan Snapshot">
            <dl className="mt-wilms-3 space-y-wilms-2 text-small">
              <div>
                <dt className="text-text-muted">Loan ID</dt>
                <dd className="font-semibold">{resolveLoanDisplayId(activeLoan)}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Outstanding</dt>
                <dd className="font-semibold">
                  <CurrencyAmount value={activeLoan.outstandingPesewas} />
                </dd>
              </div>
            </dl>
          </DetailSidebarCard>
        ) : null}
        <DetailSidebarCard title="Risk Summary">
          <dl className="mt-wilms-3 space-y-wilms-2 text-small">
            <div>
              <dt className="text-text-muted">Risk rating</dt>
              <dd className="font-semibold">{risk.riskRating}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Missed payments</dt>
              <dd className="font-semibold">{risk.missedPaymentCount}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Default status</dt>
              <dd className="font-semibold">{risk.defaultStatus}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Blacklist status</dt>
              <dd className="font-semibold">{risk.blacklistStatus}</dd>
            </div>
          </dl>
        </DetailSidebarCard>
      </>
    );
  }, [activeLoanId, borrower, borrowerId, loans]);

  useShellAsideContent(asideContent);

  if (isLoading || isLoansLoading) {
    return <InlinePanelSkeleton />;
  }

  if (isError) {
    return (
      <QueryErrorState
        error={error}
        onRetry={() => void refetch()}
        title="Borrower not found"
        description="This borrower profile could not be loaded."
      />
    );
  }

  if (!borrower) {
    return (
      <EmptyState
        title="Borrower not found"
        description="This borrower profile could not be loaded."
        action={
          <Link href="/borrowers" className="text-small font-semibold text-brand-primary hover:underline">
            Back to borrowers
          </Link>
        }
      />
    );
  }

  const loanHistory = loans ?? [];
  const activeLoan = loanHistory.find((loan) => loan.id === activeLoanId);
  const risk = resolveBorrowerRisk(borrower.risk);

  return (
    <div className="space-y-wilms-4" data-print-profile="borrower">
      <div className="flex flex-wrap items-start justify-between gap-wilms-3">
        <div className="flex flex-wrap items-center gap-wilms-3">
          <Avatar
            label={borrower.fullName}
            photoUrl={resolveEntityPhotoUrl({
              name: borrower.fullName,
              id: borrower.id,
              photoUrl: borrower.photoUrl,
            })}
            size="lg"
          />
          <div>
            <div className="flex flex-wrap items-center gap-wilms-3">
              <h1 className="text-heading-1 font-semibold text-text-primary">{borrower.fullName}</h1>
              <StatusBadge status={borrower.status} />
            </div>
            <p className="text-small text-text-muted">{resolveBorrowerDisplayId(borrower)}</p>
          </div>
        </div>
        <BorrowerProfileActions
          borrower={borrower}
          loans={loanHistory}
          activeLoan={activeLoan}
          progress={progress}
          paymentLog={paymentLog ?? []}
          scheduleWeeks={schedule?.weeks ?? []}
        />
      </div>

      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Total loans" value={loanHistory.length} />
        <KpiCard
          variant="executive"
          label="Outstanding"
          value={
            <CurrencyAmount
              value={loanHistory.reduce((sum, loan) => sum + loan.outstandingPesewas, 0)}
            />
          }
        />
        <KpiCard variant="executive" label="Risk rating" value={risk.riskRating} />
        <KpiCard
          variant="executive"
          label="Registered"
          value={formatDisplayDate(borrower.registeredAt)}
        />
      </ExecutiveKpiGrid>

      <ProfileSection title="Personal Information">
        <ProfileFieldGrid
          columns={3}
          items={[
            { label: 'Full Name', value: borrower.fullName },
            { label: 'Borrower ID', value: resolveBorrowerDisplayId(borrower) },
            { label: 'Phone Number', value: borrower.phone },
            { label: 'Alternative Phone', value: borrower.alternativePhone ?? 'Not provided' },
            { label: 'Email Address', value: borrower.email ?? 'Not provided' },
            { label: 'Address', value: borrower.houseAddress ?? borrower.community },
            { label: 'GPS Location', value: borrower.gpsAddress ?? 'Not provided' },
            { label: 'National ID', value: borrower.nationalId },
            { label: 'Registration Date', value: formatDisplayDate(borrower.registeredAt) },
            { label: 'Status', value: <StatusBadge status={borrower.status} /> },
            {
              label: 'Group',
              value: borrower.groupId ? (
                <Link href={`/groups/${borrower.groupId}`} className="font-semibold text-brand-primary hover:underline">
                  {borrower.groupName}
                </Link>
              ) : (
                borrower.groupName
              ),
            },
            { label: 'Community', value: borrower.community },
            { label: 'Date of Birth', value: borrower.dateOfBirth ?? '—' },
            { label: 'Gender', value: borrower.gender ?? '—' },
            { label: 'Nationality', value: borrower.nationality ?? '—' },
          ]}
        />
      </ProfileSection>

      <ProfileSection title="Loan Information">
        {!activeLoan ? (
          <p className="text-body text-text-muted">This borrower has no active loan on record.</p>
        ) : (
          <>
            <ProfileFieldGrid
              columns={3}
              items={[
                { label: 'Current Loan', value: resolveLoanDisplayId(activeLoan) },
                {
                  label: 'Loan Amount',
                  value: <CurrencyAmount value={activeLoan.amountPesewas} />,
                },
                { label: 'Disbursement Date', value: formatDisplayDate(activeLoan.startDate) },
                {
                  label: 'Outstanding Balance',
                  value: <CurrencyAmount value={activeLoan.outstandingPesewas} />,
                },
                {
                  label: 'Amount Repaid',
                  value: (
                    <CurrencyAmount
                      value={activeLoan.amountPesewas - activeLoan.outstandingPesewas}
                    />
                  ),
                },
                {
                  label: 'Remaining Balance',
                  value: <CurrencyAmount value={activeLoan.outstandingPesewas} />,
                },
                {
                  label: 'Weeks Remaining',
                  value: progress?.weeksRemaining ?? activeLoan.durationWeeks,
                },
                {
                  label: 'Loan Status',
                  value: <LoanStatusBadge status={activeLoan.status} />,
                },
              ]}
            />
            {progress ? (
              <div className="mt-wilms-4">
                <LoanProgressMetrics progress={progress} />
              </div>
            ) : null}
          </>
        )}
      </ProfileSection>

      <ProfileSection title="Payment History">
        {paymentLog?.length ? (
          <LoanPaymentLogTable entries={paymentLog} detailed />
        ) : (
          <p className="text-body text-text-muted">No payment history recorded yet.</p>
        )}
      </ProfileSection>

      <ProfileSection title="Payment Schedule">
        {schedule?.weeks.length ? (
          <LoanScheduleTable weeks={schedule.weeks} />
        ) : (
          <p className="text-body text-text-muted">No payment schedule available.</p>
        )}
      </ProfileSection>

      <ProfileSection title="Risk Information">
        <ProfileFieldGrid
          columns={3}
          items={[
            { label: 'Risk Rating', value: risk.riskRating },
            { label: 'Missed Payment Count', value: risk.missedPaymentCount },
            { label: 'Default Status', value: risk.defaultStatus },
            { label: 'Blacklist Status', value: risk.blacklistStatus },
            {
              label: 'Flags',
              value: risk.flags.length ? risk.flags.join(', ') : 'None',
            },
            {
              label: 'Notes',
              value: risk.notes.length ? risk.notes.join(' ') : 'None',
            },
          ]}
        />
      </ProfileSection>

      <ProfileSection title="All Loans">
        <DataTable
          variant="executive"
          caption="Borrower loan history"
          data={loanHistory}
          getRowId={(row) => row.id}
          columns={[
            { id: 'id', header: 'Loan ID', cell: (row) => resolveLoanDisplayId(row) },
            {
              id: 'amount',
              header: 'Amount',
              cell: (row) => <CurrencyAmount value={row.amountPesewas} />,
            },
            {
              id: 'outstanding',
              header: 'Outstanding',
              cell: (row) => <CurrencyAmount value={row.outstandingPesewas} />,
            },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => <LoanStatusBadge status={row.status} />,
            },
            {
              id: 'action',
              header: 'View',
              cell: (row) => (
                <Link
                  href={`/borrowers/${borrowerId}/loan?loanId=${row.id}`}
                  className="text-small font-semibold text-brand-primary hover:underline"
                >
                  Open loan
                </Link>
              ),
            },
          ]}
        />
      </ProfileSection>
    </div>
  );
}
