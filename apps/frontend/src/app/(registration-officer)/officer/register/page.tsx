import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { BorrowerRegistrationWizard } from '@/features/borrower-registration/components/BorrowerRegistrationWizard';
import { OfficerWorkspaceHome } from '@/features/role-homes/components/OfficerWorkspaceHome';

export default function RegisterPage() {
  return (
    <PageShell variant="executive">
      <OfficerWorkspaceHome />
      <ModulePageIntro guidanceKey="officerRegister" />
      <BorrowerRegistrationWizard />
    </PageShell>
  );
}
