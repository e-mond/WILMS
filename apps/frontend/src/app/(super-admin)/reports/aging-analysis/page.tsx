import { PageShell } from '@/components/layout/PageShell';
import { AgingAnalysisReportPanel } from '@/features/reports/components/AgingAnalysisReportPanel';

export default function AgingAnalysisReportPage() {
  return (
    <PageShell variant="executive">
      <AgingAnalysisReportPanel />
    </PageShell>
  );
}
