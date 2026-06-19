import { PageShell } from '@/components/layout/PageShell';
import { CollectorDashboardPanel } from '@/features/payment-collection/components/CollectorDashboardPanel';

export default function CollectorDashboardPage() {
  return (
    <PageShell variant="executive">
      <CollectorDashboardPanel />
    </PageShell>
  );
}
