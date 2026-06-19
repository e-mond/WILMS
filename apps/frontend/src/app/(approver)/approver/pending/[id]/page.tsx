import { PageShell } from '@/components/layout/PageShell';
import { PendingApplicationReview } from '@/features/approval-workflow/components/PendingApplicationReview';

export default function PendingApplicationReviewPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <PageShell variant="executive">
      <PendingApplicationReview borrowerId={params.id} />
    </PageShell>
  );
}
