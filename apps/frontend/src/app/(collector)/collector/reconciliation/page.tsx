import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { ReconciliationForm } from '@/features/reconciliation/components/ReconciliationForm';

export default function CollectorReconciliationPage() {
  return (
    <PageShell variant="executive">
      <ModulePageIntro guidanceKey="collectorReconciliation" />
      <ReconciliationForm />
    </PageShell>
  );
}
