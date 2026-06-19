import { PageShell } from '@/components/layout/PageShell';
import { DefaulterReportPanel } from '@/features/reports/components/DefaulterReportPanel';

export default function DefaulterReportPage() {
  return (
    <PageShell variant="executive">
      <DefaulterReportPanel />
    </PageShell>
  );
}
