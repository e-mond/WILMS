import { PageShell } from '@/components/layout/PageShell';
import { GroupRiskReportPanel } from '@/features/reports/components/GroupRiskReportPanel';

export default function GroupRiskReportPage() {
  return (
    <PageShell variant="executive">
      <GroupRiskReportPanel />
    </PageShell>
  );
}
