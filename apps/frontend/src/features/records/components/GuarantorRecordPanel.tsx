'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Avatar } from '@/components/data-display';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { apiClient } from '@/utils/apiClient';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';

export interface GuarantorRecordFile {
  guarantorPhone: string;
  guarantorName: string;
  guarantorPhotoUrl?: string | null;
  guarantorRelationship?: string;
  activeGuaranteeCount: number;
  maxGuarantees: number;
  isAlsoBorrower: boolean;
  borrowerProfileId?: string;
  borrowerProfileName?: string;
  guaranteedBorrowers: Array<{
    borrowerId: string;
    borrowerName: string;
    phone: string;
    community: string;
    status: string;
    href: string;
  }>;
}

export function GuarantorRecordPanel({ phoneKey }: { phoneKey: string }) {
  const pathname = usePathname();
  const recordsBase = pathname.includes('/approver/records')
    ? '/approver/records'
    : pathname.includes('/officer/records')
      ? '/officer/records'
      : pathname.includes('/auditor/records')
        ? '/auditor/records'
        : '/records';

  const query = useQuery({
    queryKey: ['records', 'guarantor', phoneKey],
    queryFn: () =>
      apiClient.get<GuarantorRecordFile>(`/records/guarantors/${encodeURIComponent(phoneKey)}`),
  });

  if (query.isLoading) return <InlinePanelSkeleton />;
  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => void query.refetch()}
        title="Guarantor not found"
        description="No guarantor file matches this phone number."
      />
    );
  }

  const file = query.data;
  if (!file) {
    return <EmptyState title="Guarantor not found" description="No guarantor file is available." />;
  }

  return (
    <div className="space-y-wilms-6">
      <div className="flex flex-wrap items-start gap-wilms-4 rounded-sm border border-border bg-card p-wilms-4">
        <Avatar
          label={file.guarantorName}
          photoUrl={resolveEntityPhotoUrl({
            name: file.guarantorName,
            id: file.guarantorPhone,
            photoUrl: file.guarantorPhotoUrl,
          })}
          size="2xl"
          className="rounded-sm border border-border object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-caption uppercase tracking-wide text-text-muted">Guarantor record</p>
          <h1 className="text-heading-1 font-semibold text-text-primary">{file.guarantorName}</h1>
          <p className="text-body text-text-muted">{file.guarantorPhone}</p>
          <p className="mt-wilms-2 text-small text-text-muted">
            Active guarantees: {file.activeGuaranteeCount} of {file.maxGuarantees}
            {file.guarantorRelationship ? ` · ${file.guarantorRelationship}` : ''}
          </p>
          {file.isAlsoBorrower && file.borrowerProfileId ? (
            <p className="mt-wilms-2 text-small text-status-info">
              Also registered as a borrower:{' '}
              <Link href={`${recordsBase}/${file.borrowerProfileId}`} className="font-semibold underline">
                {file.borrowerProfileName ?? 'View borrower file'}
              </Link>
            </p>
          ) : null}
        </div>
      </div>

      <section className="rounded-sm border border-border bg-card p-wilms-4">
        <h2 className="text-heading-3 font-semibold text-text-primary">Borrowers guaranteed</h2>
        {file.guaranteedBorrowers.length === 0 ? (
          <p className="mt-wilms-3 text-small text-text-muted">No active guarantee links on file.</p>
        ) : (
          <ul className="mt-wilms-3 divide-y divide-border">
            {file.guaranteedBorrowers.map((borrower) => (
              <li key={borrower.borrowerId} className="py-wilms-3">
                <Link href={borrower.href.startsWith('/') ? borrower.href : `${recordsBase}/${borrower.borrowerId}`} className="block hover:opacity-90">
                  <p className="font-semibold text-text-primary">{borrower.borrowerName}</p>
                  <p className="text-small text-text-muted">
                    {borrower.phone} · {borrower.community} · {borrower.status}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
