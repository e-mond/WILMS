import { PageShell } from '@/components/layout/PageShell';
import { RoleSettingsPanel } from '@/features/settings/components/RoleSettingsPanel';
import { USER_ROLE } from '@/constants/roles';

export default function AuditorSettingsPage() {
  return (
    <PageShell description="Profile, security, and audit preferences.">
      <RoleSettingsPanel role={USER_ROLE.AUDITOR} />
    </PageShell>
  );
}
