import dynamic from 'next/dynamic';
import { PageShell } from '@/components/layout/PageShell';
import { PageLoadingFallback } from '@/components/layout/PageLoadingFallback';

const ExportCenterPanel = dynamic(
  () =>
    import('@/features/intelligence/components/ExportCenterPanel').then((module) => ({
      default: module.ExportCenterPanel,
    })),
  { loading: () => <PageLoadingFallback label="Loading export center" /> },
);

export default function ExportCenterPage() {
  return (
    <PageShell variant="executive">
      <ExportCenterPanel />
    </PageShell>
  );
}
