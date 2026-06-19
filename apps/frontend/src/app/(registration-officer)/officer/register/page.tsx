import { PageShell } from '@/components/layout/PageShell';
import { BorrowerRegistrationWizard } from '@/features/borrower-registration/components/BorrowerRegistrationWizard';

export default function RegisterPage() {
  return (
    <PageShell variant="executive">
      <BorrowerRegistrationWizard />
    </PageShell>
  );
}
