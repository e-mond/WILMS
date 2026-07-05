import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { AdjustmentsPanel } from '@/features/adjustments/components/AdjustmentsPanel';

export default function AdjustmentsPage() {
  return (
    <PageShell variant="executive">
      <ModulePageIntro guidanceKey="adjustments" />
      <AdjustmentsPanel />
    </PageShell>
  );
}
