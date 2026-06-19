import { PageShell } from '@/components/layout/PageShell';
import { CollectorMyBorrowersPanel } from '@/features/payment-collection/components/CollectorMyBorrowersPanel';

export default function CollectorMyBorrowersPage() {
  return (
    <PageShell variant="executive">
      <CollectorMyBorrowersPanel />
    </PageShell>
  );
}
