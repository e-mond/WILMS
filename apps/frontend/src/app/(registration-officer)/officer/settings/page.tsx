import { PageShell } from '@/components/layout/PageShell';
import { RoleSettingsPanel } from '@/features/settings/components/RoleSettingsPanel';
import { USER_ROLE } from '@/constants/roles';

export default function RegistrationOfficerSettingsPage() {
  return (
    <PageShell description="Profile, app lock, camera, and sync preferences for registration work.">
      <RoleSettingsPanel role={USER_ROLE.REGISTRATION_OFFICER} />
    </PageShell>
  );
}
