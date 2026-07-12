import { PageShell } from '@/components/layout/PageShell';
import { RoleSettingsPanel } from '@/features/settings/components/RoleSettingsPanel';
import { USER_ROLE } from '@/constants/roles';

export default function CollectorSettingsPage() {
  return (
    <PageShell description="Profile, app lock, notifications, and device preferences for field work.">
      <RoleSettingsPanel role={USER_ROLE.COLLECTOR} />
    </PageShell>
  );
}
