import { PendingBorrowerUpdateQueue } from '@/features/borrower-updates/components/PendingBorrowerUpdateQueue';
import { PageShell } from '@/components/layout/PageShell';

export default function OfficerBorrowerUpdatesPage() {
  return (
    <PageShell description="Review collector requests to update borrower information.">
      <h1 className="text-heading-1 font-semibold text-text-primary">Pending borrower update requests</h1>
      <PendingBorrowerUpdateQueue />
    </PageShell>
  );
}
