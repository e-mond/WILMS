import { CollectorBorrowerUpdatePanel } from '@/features/borrower-updates/components/CollectorBorrowerUpdatePanel';
import { PageShell } from '@/components/layout/PageShell';

export default function CollectorBorrowerUpdatesPage() {
  return (
    <PageShell description="Request borrower information changes for Registration Officer review.">
      <h1 className="text-heading-1 font-semibold text-text-primary">Borrower update requests</h1>
      <CollectorBorrowerUpdatePanel />
    </PageShell>
  );
}
