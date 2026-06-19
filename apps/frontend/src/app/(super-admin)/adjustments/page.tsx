import { PageShell } from '@/components/layout/PageShell';
import { AdjustmentsPanel } from '@/features/adjustments/components/AdjustmentsPanel';

export default function AdjustmentsPage() {
  return (
    <PageShell variant="executive">
      <AdjustmentsPanel />
    </PageShell>
  );
}
