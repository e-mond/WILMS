import { PageShell } from '@/components/layout/PageShell';
import { WriteOffsReportPanel } from '@/features/reports/components/WriteOffsReportPanel';

export default function WriteOffsReportPage() {
  return (
    <PageShell variant="executive">
      <WriteOffsReportPanel />
    </PageShell>
  );
}
