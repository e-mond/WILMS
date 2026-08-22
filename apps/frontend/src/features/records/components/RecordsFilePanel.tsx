'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Avatar, CurrencyAmount, DataTable, LoanScheduleTable, LoanStatusBadge } from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { WilmsExportActions } from '@/features/export';
import { buildBorrowerProfileExportDocument } from '@/features/export/builders/borrower-profile-document';
import { useWilmsExportActor } from '@/features/export/hooks/useWilmsExportActor';
import { apiClient } from '@/utils/apiClient';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';
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
  const activeLoan = borrower.loans?.find((loan) => loan.id === file.activeLoanId) ??
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

  return (
    <div className="space-y-wilms-6">
      <div className="flex flex-wrap items-start gap-wilms-4 rounded-sm border border-border bg-card p-wilms-4">
        <Avatar
          label={borrower.fullName}
          photoUrl={resolveEntityPhotoUrl({
            name: borrower.fullName,
            id: borrower.id,
            photoUrl: borrower.photoUrl,
          })}
          size="2xl"
          className="rounded-sm border border-border object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-caption uppercase tracking-wide text-text-muted">Borrower record</p>
          <h1 className="text-heading-1 font-semibold text-text-primary">{borrower.fullName}</h1>
          <p className="text-body text-text-muted">{borrower.displayId ?? borrower.id}</p>
          <p className="mt-wilms-2 text-small text-text-muted">
            {borrower.phone} · {borrower.community} · {borrower.status}
          </p>
          <p className="text-small text-text-muted">
            Group: {borrower.groupName || 'Unassigned'}
            {borrower.groupRole ? ` (${borrower.groupRole})` : ''}
            {borrower.collectorLabel ? ` · Collector: ${borrower.collectorLabel}` : ''}
          </p>
        </div>
        <WilmsExportActions
          document={exportDocument}
          filenameBase={`borrower-record-${borrower.displayId ?? borrower.id}`}
          formats={['pdf', 'word', 'print']}
        />
      </div>

      <section className="grid gap-wilms-4 md:grid-cols-2">
        <RecordCard title="Personal details">
          <Row label="Ghana Card / ID" value={borrower.nationalId} />
          <Row label="Date of birth" value={borrower.dateOfBirth} />
          <Row label="Gender" value={borrower.gender} />
          <Row label="Email" value={borrower.email} />
          <Row label="House address" value={borrower.houseAddress} />
          <Row label="GPS / Digital address" value={borrower.gpsAddress} />
          <Row label="Region / District" value={[borrower.region, borrower.district].filter(Boolean).join(' · ')} />
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
            />
            <div>
              <Row label="Name" value={borrower.guarantorName} />
              <Row label="Phone" value={borrower.guarantorPhone} />
              {borrower.guarantorPhone ? (
                <Link
                  href={`/records/guarantor/${encodeURIComponent(borrower.guarantorPhone)}`}
                  className="text-small font-semibold text-brand-primary underline"
                >
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
              { id: 'id', header: 'Loan', cell: (row) => row.id },
              { id: 'status', header: 'Status', cell: (row) => <LoanStatusBadge status={row.status} /> },
              { id: 'amount', header: 'Principal', cell: (row) => <CurrencyAmount value={row.amountPesewas} /> },
              { id: 'outstanding', header: 'Outstanding', cell: (row) => <CurrencyAmount value={row.outstandingPesewas} /> },
              { id: 'cycle', header: 'Cycle', cell: (row) => row.cycleBatch },
              { id: 'start', header: 'Start', cell: (row) => row.startDate },
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
              { id: 'date', header: 'Date', cell: (row) => row.recordedAt },
              { id: 'amount', header: 'Amount', cell: (row) => <CurrencyAmount value={row.amountPesewas} /> },
              { id: 'week', header: 'Week', cell: (row) => row.weekNumber ?? '—' },
              { id: 'collector', header: 'Collector', cell: (row) => row.collectorLabel ?? row.collectorName ?? '—' },
            ]}
          />
        </RecordCard>
      ) : null}

      <RecordCard title="Audit timeline">
        {file.audit.length === 0 ? (
          <p className="text-small text-text-muted">No audit events on this file yet.</p>
        ) : (
          <ul className="space-y-wilms-2 text-small">
            {file.audit.map((entry) => (
              <li key={entry.id}>
                {entry.createdAt} · {entry.action}
                {entry.reason ? ` — ${entry.reason}` : ''}
              </li>
            ))}
          </ul>
        )}
      </RecordCard>

      <RecordCard title="Notifications sent">
        {file.notifications.length === 0 ? (
          <p className="text-small text-text-muted">No recorded SMS or email deliveries.</p>
        ) : (
          <ul className="space-y-wilms-2 text-small">
            {file.notifications.map((entry) => (
              <li key={entry.id}>
                {entry.createdAt} · {entry.channel} · {entry.event} · {entry.success ? 'sent' : 'failed'}
              </li>
            ))}
          </ul>
        )}
      </RecordCard>
    </div>
  );
}

function RecordCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-border bg-card p-wilms-4">
      <h2 className="text-heading-3 font-semibold text-text-primary">{title}</h2>
      <div className="mt-wilms-3 space-y-wilms-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <p className="text-small">
      <span className="font-semibold text-text-primary">{label}: </span>
      <span className="text-text-muted">{value?.trim() || 'Not recorded'}</span>
    </p>
  );
}
