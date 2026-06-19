import { PageShell } from '@/components/layout/PageShell';
import { CreateLoanWizard } from '@/features/loan-management/components/CreateLoanWizard';

export default function CreateLoanPage() {
  return (
    <PageShell variant="executive">
      <CreateLoanWizard />
    </PageShell>
  );
}
