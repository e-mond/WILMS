import { PageShell } from '@/components/layout/PageShell';
import { ReportsIndexPanel } from '@/features/reports/components/ReportsIndexPanel';

export default function AuditorReportsPage() {
  return (
    <PageShell
      description="Read-only operational and compliance reports."
      variant="executive"
    >
      <ReportsIndexPanel categoryFilterMode="auditor" />
    </PageShell>
  );
}
