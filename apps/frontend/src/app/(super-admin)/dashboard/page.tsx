import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { SuperAdminDashboard } from '@/features/super-admin-dashboard/components/SuperAdminDashboard';

export default function SuperAdminDashboardPage() {
  return (
    <PageShell variant="executive">
      <ModulePageIntro guidanceKey="dashboard" />
      <SuperAdminDashboard />
    </PageShell>
  );
}
