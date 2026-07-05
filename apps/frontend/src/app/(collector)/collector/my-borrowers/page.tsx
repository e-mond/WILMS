import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { CollectorMyBorrowersPanel } from '@/features/payment-collection/components/CollectorMyBorrowersPanel';

export default function CollectorMyBorrowersPage() {
  return (
    <PageShell variant="executive">
      <ModulePageIntro guidanceKey="collectorMyBorrowers" />
      <CollectorMyBorrowersPanel />
    </PageShell>
  );
}
