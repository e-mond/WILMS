import { PageShell } from '@/components/layout/PageShell';
import { AppLockSetupPanel } from '@/features/app-lock/components/AppLockSetupPanel';

export default function CollectorSecurityPage() {
  return (
    <PageShell
      description="Configure device-level PIN protection for field work."
    >
      <AppLockSetupPanel />
    </PageShell>
  );
}
