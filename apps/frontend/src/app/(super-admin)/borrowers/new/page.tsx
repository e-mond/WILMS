import { PageShell } from '@/components/layout/PageShell';
import { BorrowerRegistrationWizard } from '@/features/borrower-registration/components/BorrowerRegistrationWizard';

export default function NewBorrowerPage() {
  return (
    <PageShell variant="executive">
      <div className="mb-wilms-4 space-y-wilms-1">
        <h1 className="text-heading-1 font-semibold text-text-primary">Add borrower</h1>
        <p className="text-body text-text-muted">
          Register a new borrower application for review and approval.
        </p>
      </div>
      <BorrowerRegistrationWizard />
    </PageShell>
  );
}
