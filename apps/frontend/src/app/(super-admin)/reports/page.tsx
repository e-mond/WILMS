import dynamic from 'next/dynamic';
import { PageShell } from '@/components/layout/PageShell';
import { PageLoadingFallback } from '@/components/layout/PageLoadingFallback';

const ReportsIndexPanel = dynamic(
  () =>
    import('@/features/reports/components/ReportsIndexPanel').then((module) => ({
      default: module.ReportsIndexPanel,
    })),
  { loading: () => <PageLoadingFallback label="Loading reports" /> },
);

export default function ReportsIndexPage() {
  return (
    <PageShell variant="executive">
      <ReportsIndexPanel />
    </PageShell>
  );
}
