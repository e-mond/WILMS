import { PageShell } from '@/components/layout/PageShell';
import { ReportsIndexPanel } from '@/features/reports/components/ReportsIndexPanel';
import { AuditorWorkspaceHome } from '@/features/role-homes/components/AuditorWorkspaceHome';

export default function AuditorReportsPage() {
  return (
    <PageShell
      description="Read-only operational and compliance reports."
      variant="executive"
    >
      <AuditorWorkspaceHome />
      <ReportsIndexPanel categoryFilterMode="auditor" />
    </PageShell>
  );
}
