import { PageShell } from '@/components/layout/PageShell';
import { RoleSettingsPanel } from '@/features/settings/components/RoleSettingsPanel';
import { USER_ROLE } from '@/constants/roles';

export default function ApproverSettingsPage() {
  return (
    <PageShell description="Profile, security, and notification preferences for approval work.">
      <RoleSettingsPanel role={USER_ROLE.APPROVER} />
    </PageShell>
  );
}
