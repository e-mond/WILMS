import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { CollectorsManagementPanel } from '@/features/collector-management/components/CollectorsManagementPanel';

export default function CollectorsPage() {
  return (
    <PageShell variant="executive">
      <ModulePageIntro guidanceKey="collectors" />
      <CollectorsManagementPanel />
    </PageShell>
  );
}
