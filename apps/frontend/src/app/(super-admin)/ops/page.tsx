import dynamic from 'next/dynamic';
import { PageShell } from '@/components/layout/PageShell';
import { PageLoadingFallback } from '@/components/layout/PageLoadingFallback';

const OperationsDashboardPanel = dynamic(
  () =>
    import('@/features/ops/components/OperationsDashboardPanel').then((module) => ({
      default: module.OperationsDashboardPanel,
    })),
  { loading: () => <PageLoadingFallback label="Loading operations" /> },
);

export default function OperationsPage() {
  return (
    <PageShell variant="executive">
      <OperationsDashboardPanel />
    </PageShell>
  );
}
