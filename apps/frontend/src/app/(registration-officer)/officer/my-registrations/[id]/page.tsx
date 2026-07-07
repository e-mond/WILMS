'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { QueryErrorState } from '@/components/feedback/QueryErrorState';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { PageShell } from '@/components/layout/PageShell';
import { BorrowerReviewProfile } from '@/features/approval-workflow/components/BorrowerReviewProfile';
import { useBorrowerReview } from '@/features/approval-workflow/hooks/useBorrowerReview';
import { Button } from '@/components/ui/Button';

export default function OfficerRegistrationDetailPage() {
  const params = useParams<{ id: string }>();
  const borrowerId = params.id;
  const { data, isLoading, isError, error, refetch } = useBorrowerReview(borrowerId);

  return (
    <PageShell variant="executive">
      <QueryStatePanel
        isLoading={isLoading}
        showLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        variant="inline"
      >
        {data ? (
          <div className="space-y-wilms-4">
            <div className="flex flex-wrap items-center justify-between gap-wilms-3">
              <div>
                <h1 className="text-h2 font-semibold text-text-primary">{data.fullName}</h1>
                <p className="text-small text-text-muted">Registration review for officer-owned borrower</p>
              </div>
              <div className="flex flex-wrap gap-wilms-2">
                <Link href="/officer/my-registrations">
                  <Button type="button" variant="secondary" size="sm">
                    Back to My Registrations
                  </Button>
                </Link>
                <Link href={`/officer/register?edit=${borrowerId}`}>
                  <Button type="button" size="sm">
                    Continue editing
                  </Button>
                </Link>
              </div>
            </div>

            <BorrowerReviewProfile borrower={data} />
          </div>
        ) : (
          <QueryErrorState
            error={error}
            onRetry={() => void refetch()}
            title="Unable to load registration"
          />
        )}
      </QueryStatePanel>
    </PageShell>
  );
}
