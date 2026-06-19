import { PageShell } from '@/components/layout/PageShell';
import { SuperAdminDashboard } from '@/features/super-admin-dashboard/components/SuperAdminDashboard';

export default function SuperAdminDashboardPage() {
  return (
    <PageShell variant="executive">
      <SuperAdminDashboard />
    </PageShell>
  );
}
