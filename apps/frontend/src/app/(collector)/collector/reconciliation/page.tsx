import { PageShell } from '@/components/layout/PageShell';
import { ReconciliationForm } from '@/features/reconciliation/components/ReconciliationForm';

export default function CollectorReconciliationPage() {
  return (
    <PageShell variant="executive">
      <ReconciliationForm />
    </PageShell>
  );
}
