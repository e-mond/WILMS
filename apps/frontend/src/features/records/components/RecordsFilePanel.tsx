'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, UserRound } from 'lucide-react';
import { Avatar, CurrencyAmount, DataTable, LoanScheduleTable, LoanStatusBadge } from '@/components/data-display';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { WilmsExportActions } from '@/features/export';
import { buildBorrowerProfileExportDocument } from '@/features/export/builders/borrower-profile-document';
import { useWilmsExportActor } from '@/features/export/hooks/useWilmsExportActor';
import { apiClient } from '@/utils/apiClient';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';
import { resolveLoanDisplayId } from '@/utils/entity-display-id';
import { formatDisplayDate } from '@/utils/format-date';
import type { BorrowerFullProfile } from '@/types/borrower';
import type { LoanPaymentLogEntry } from '@/types/loan';
import type { LoanScheduleWeek } from '@/types/loan-schedule';

interface RecordsFilePayload {
  profile: BorrowerFullProfile & {
    guarantorPhotoUrl?: string | null;
    idDocumentUrl?: string | null;
    gender?: string;
    email?: string;
    businessName?: string;
    businessAddress?: string;
    typeOfWork?: string;
    subDistrictUnit?: string;
    electoralArea?: string;
  };
  audit: Array<{ id: string; action: string; createdAt: string; reason?: string }>;
  notifications: Array<{
    id: string;
    event: string;
    channel: string;
    recipient: string;
    success: boolean;
    createdAt: string;
  }>;
  paymentLog: LoanPaymentLogEntry[];
  scheduleWeeks: LoanScheduleWeek[];
  activeLoanId: string | null;
}

export function RecordsFilePanel({ borrowerId }: { borrowerId: string }) {
  const generatedBy = useWilmsExportActor();
  const query = useQuery({
    queryKey: ['records', 'file', borrowerId],
    queryFn: () => apiClient.get<RecordsFilePayload>(`/records/borrowers/${borrowerId}`),
  });

  if (query.isLoading) {
    return <InlinePanelSkeleton />;
  }

  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => void query.refetch()}
        title="Record not found"
        description="This borrower file could not be loaded."
      />
    );
  }

  const file = query.data;
  if (!file) {
    return <EmptyState title="Record not found" description="No borrower file is available." />;
  }

  const borrower = file.profile;
  const activeLoan =
    borrower.loans?.find((loan) => loan.id === file.activeLoanId) ??
    borrower.loans?.find((loan) => loan.status === 'ACTIVE') ??
    borrower.loans?.[0];

  const exportDocument = buildBorrowerProfileExportDocument({
    borrower,
    generatedBy,
    loans: borrower.loans ?? [],
    activeLoan,
    progress: borrower.progress ?? undefined,
    paymentLog: file.paymentLog,
    scheduleWeeks: file.scheduleWeeks,
    variant: 'full',
  });

  if (borrower.photoUrl || borrower.guarantorPhotoUrl) {
    exportDocument.recordPhotos = {
      borrowerPhotoUrl: borrower.photoUrl ?? undefined,
      guarantorPhotoUrl: borrower.guarantorPhotoUrl ?? undefined,
      borrowerName: borrower.fullName,
      guarantorName: borrower.guarantorName,
    };
  }

  const missedWeeks =
    file.scheduleWeeks.filter((week) => week.status === 'MISSED').length ||
    borrower.progress?.totalMissed ||
    0;

  return (
    <div className="space-y-wilms-5">
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="bg-gradient-to-br from-brand-primary/[0.09] via-transparent to-sky-500/[0.05] px-wilms-5 py-wilms-5 sm:px-wilms-6">
          <div className="flex flex-col gap-wilms-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-wilms-4">
              <Avatar
                label={borrower.fullName}
                photoUrl={resolveEntityPhotoUrl({
                  name: borrower.fullName,
                  id: borrower.id,
                  photoUrl: borrower.photoUrl,
                })}
                size="2xl"
                className="rounded-2xl border border-border/80 object-cover shadow-sm"
              />
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 text-small font-semibold uppercase tracking-wide text-brand-primary">
                  <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  Borrower file
                </p>
                <h1 className="mt-wilms-1 text-heading-1 font-semibold text-text-primary">
                  {borrower.fullName}
                </h1>
                <p className="mt-0.5 font-mono text-small text-text-muted">
                  {borrower.displayId ?? borrower.id}
                </p>
                <div className="mt-wilms-3 flex flex-wrap items-center gap-2">
                  <Badge variant="default">{borrower.status}</Badge>
                  <span className="text-small text-text-muted">{borrower.phone}</span>
                  <span className="text-small text-text-muted">·</span>
                  <span className="text-small text-text-muted">{borrower.community}</span>
                </div>
                <p className="mt-wilms-2 text-small text-text-muted">
                  Group: {borrower.groupName || 'Unassigned'}
                  {borrower.groupRole ? ` (${borrower.groupRole})` : ''}
                  {borrower.collectorLabel ? ` · Collector: ${borrower.collectorLabel}` : ''}
                </p>
              </div>
            </div>
            <WilmsExportActions
              document={exportDocument}
              filenameBase={`borrower-record-${borrower.displayId ?? borrower.id}`}
              formats={['pdf', 'word', 'print']}
            />
          </div>
        </div>
      </div>

      <section className="grid gap-wilms-3 md:grid-cols-3">
        <RecordCard title="Repayment status">
          <Row label="Missed weeks" value={String(missedWeeks)} />
          <Row label="Weeks completed" value={String(borrower.progress?.weeksCompleted ?? '—')} />
          <Row
            label="Payment consistency"
            value={
              borrower.progress?.paymentConsistencyScore != null
                ? `${borrower.progress.paymentConsistencyScore}%`
                : '—'
            }
          />
          <Row
            label="Outstanding arrears"
            value={missedWeeks > 0 ? `${missedWeeks} instalment(s)` : 'None'}
          />
        </RecordCard>
        <RecordCard title="Personal details">
          <Row label="Ghana Card / ID" value={borrower.nationalId} />
          <Row label="Date of birth" value={borrower.dateOfBirth} />
          <Row label="Gender" value={borrower.gender} />
          <Row label="Email" value={borrower.email} />
          <Row label="House address" value={borrower.houseAddress} />
          <Row label="GPS / Digital address" value={borrower.gpsAddress} />
          <Row
            label="Region / District"
            value={[borrower.region, borrower.district].filter(Boolean).join(' · ')}
          />
          <Row label="Business" value={borrower.businessName} />
          <Row label="Type of work" value={borrower.typeOfWork} />
        </RecordCard>
        <RecordCard title="Guarantor">
          <div className="flex items-start gap-wilms-3">
            <Avatar
              label={borrower.guarantorName ?? 'Guarantor'}
              photoUrl={resolveEntityPhotoUrl({
                name: borrower.guarantorName ?? 'Guarantor',
                id: borrower.guarantorPhone ?? borrower.id,
                photoUrl: borrower.guarantorPhotoUrl,
              })}
              size="lg"
              className="rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <Row label="Name" value={borrower.guarantorName} />
              <Row label="Phone" value={borrower.guarantorPhone} />
              {borrower.guarantorPhone ? (
                <Link
                  href={`/records/guarantor/${encodeURIComponent(borrower.guarantorPhone)}`}
                  className="mt-1 inline-flex items-center gap-1 text-small font-semibold text-brand-primary hover:underline"
                >
                  <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                  Open guarantor file
                </Link>
              ) : null}
            </div>
          </div>
        </RecordCard>
      </section>

      {borrower.loans && borrower.loans.length > 0 ? (
        <RecordCard title="Loans">
          <DataTable
            variant="executive"
            caption="Borrower loans"
            data={borrower.loans}
            getRowId={(row) => row.id}
            columns={[
              { id: 'id', header: 'Loan', cell: (row) => resolveLoanDisplayId(row) },
              {
                id: 'status',
                header: 'Status',
                cell: (row) => <LoanStatusBadge status={row.status} />,
              },
              {
                id: 'amount',
                header: 'Principal',
                cell: (row) => <CurrencyAmount value={row.amountPesewas} />,
              },
              {
                id: 'outstanding',
                header: 'Outstanding',
                cell: (row) => <CurrencyAmount value={row.outstandingPesewas} />,
              },
              { id: 'cycle', header: 'Cycle', cell: (row) => row.cycleBatch },
              {
                id: 'start',
                header: 'Start',
                cell: (row) => formatDisplayDate(row.startDate),
              },
            ]}
          />
        </RecordCard>
      ) : null}

      {file.scheduleWeeks.length > 0 ? (
        <RecordCard title="Repayment schedule">
          <LoanScheduleTable weeks={file.scheduleWeeks} />
        </RecordCard>
      ) : null}

      {file.paymentLog.length > 0 ? (
        <RecordCard title="Payment history">
          <DataTable
            variant="executive"
            caption="Payment log"
            data={file.paymentLog}
            getRowId={(row) => row.id}
            columns={[
              {
                id: 'date',
                header: 'Date',
                cell: (row) => formatDisplayDate(row.recordedAt),
              },
              {
                id: 'amount',
                header: 'Amount',
                cell: (row) => <CurrencyAmount value={row.amountPesewas} />,
              },
              {
                id: 'week',
                header: 'Week',
                cell: (row) =>
                  row.weekNumber != null && row.weekNumber > 0 ? `Week ${row.weekNumber}` : '—',
              },
              {
                id: 'collector',
                header: 'Collector',
                cell: (row) => row.collectorLabel ?? row.collectorName ?? '—',
              },
            ]}
          />
        </RecordCard>
      ) : null}

      <div className="grid gap-wilms-3 lg:grid-cols-2">
        <RecordCard title="Audit timeline">
          {file.audit.length === 0 ? (
            <p className="text-small text-text-muted">No audit events on this file yet.</p>
          ) : (
            <ul className="space-y-wilms-2">
              {file.audit.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-border/70 bg-background/50 px-wilms-3 py-wilms-2 text-small"
                >
                  <span className="font-semibold text-text-primary">{entry.action}</span>
                  <span className="text-text-muted"> · {entry.createdAt}</span>
                  {entry.reason ? (
                    <p className="mt-0.5 text-text-muted">{entry.reason}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </RecordCard>

        <RecordCard title="Notifications sent">
          {file.notifications.length === 0 ? (
            <p className="text-small text-text-muted">No recorded SMS or email deliveries.</p>
          ) : (
            <ul className="space-y-wilms-2">
              {file.notifications.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-border/70 bg-background/50 px-wilms-3 py-wilms-2 text-small"
                >
                  <span className="font-semibold text-text-primary">{entry.event}</span>
                  <span className="text-text-muted">
                    {' '}
                    · {entry.channel} · {entry.success ? 'sent' : 'failed'}
                  </span>
                  <p className="mt-0.5 text-text-muted">{entry.createdAt}</p>
                </li>
              ))}
            </ul>
          )}
        </RecordCard>
      </div>
    </div>
  );
}

function RecordCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-card">
      <div className="border-b border-border/70 px-wilms-4 py-wilms-3">
        <h2 className="text-heading-3 font-semibold text-text-primary">{title}</h2>
      </div>
      <div className="space-y-wilms-2 px-wilms-4 py-wilms-4">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/50 py-2 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-wilms-3">
      <span className="text-small font-semibold text-text-primary">{label}</span>
      <span className="text-small text-text-muted sm:text-right">{value?.trim() || 'Not recorded'}</span>
    </div>
  );
}
