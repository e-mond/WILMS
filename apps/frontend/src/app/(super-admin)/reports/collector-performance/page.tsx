import { PageShell } from '@/components/layout/PageShell';
import { CollectorPerformanceReportPanel } from '@/features/reports/components/CollectorPerformanceReportPanel';

export default function CollectorPerformanceReportPage() {
  return (
    <PageShell variant="executive">
      <CollectorPerformanceReportPanel />
    </PageShell>
  );
}
