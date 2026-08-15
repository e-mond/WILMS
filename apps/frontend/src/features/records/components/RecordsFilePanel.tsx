'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Avatar } from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { WilmsExportActions } from '@/features/export';
import { buildBorrowerProfileExportDocument } from '@/features/export/builders/borrower-profile-document';
import { useWilmsExportActor } from '@/features/export/hooks/useWilmsExportActor';
import { apiClient } from '@/utils/apiClient';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';
import type { BorrowerFullProfile } from '@/types/borrower';

interface RecordsFilePayload {
  profile: BorrowerFullProfile;
  audit: Array<{ id: string; action: string; createdAt: string; reason?: string }>;
  notifications: Array<{
    id: string;
    event: string;
    channel: string;
    recipient: string;
    success: boolean;
    createdAt: string;
  }>;
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
  const exportDocument = buildBorrowerProfileExportDocument({
    borrower,
    generatedBy,
    loans: [],
    paymentLog: [],
    scheduleWeeks: [],
  });

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
          <Row label="House address" value={borrower.houseAddress} />
          <Row label="GPS / Digital address" value={borrower.gpsAddress} />
        </RecordCard>
        <RecordCard title="Guarantor">
          <Row label="Name" value={borrower.guarantorName} />
          <Row label="Phone" value={borrower.guarantorPhone} />
        </RecordCard>
      </section>

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

      <p className="text-caption text-text-muted">
        Open the operational profile for loans and payments:{' '}
        <Link href={`/borrowers/${borrower.id}`} className="font-semibold text-brand-primary">
          Borrower profile
        </Link>
      </p>
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
