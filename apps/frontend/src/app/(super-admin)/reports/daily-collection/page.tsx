import { PageShell } from '@/components/layout/PageShell';
import { DailyCollectionReportPanel } from '@/features/reports/components/DailyCollectionReportPanel';

export default function DailyCollectionReportPage() {
  return (
    <PageShell variant="executive">
      <DailyCollectionReportPanel />
    </PageShell>
  );
}
