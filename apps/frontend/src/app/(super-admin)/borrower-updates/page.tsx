import { PendingBorrowerUpdateQueue } from '@/features/borrower-updates/components/PendingBorrowerUpdateQueue';
import { PageShell } from '@/components/layout/PageShell';

export default function AdminBorrowerUpdatesPage() {
  return (
    <PageShell variant="executive" description="Review and apply collector borrower information requests.">
      <h1 className="text-heading-1 font-semibold text-text-primary">Pending borrower update requests</h1>
      <PendingBorrowerUpdateQueue />
    </PageShell>
  );
}
