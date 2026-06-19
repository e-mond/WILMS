import { PageShell } from '@/components/layout/PageShell';
import { CollectorsManagementPanel } from '@/features/collector-management/components/CollectorsManagementPanel';

export default function CollectorsPage() {
  return (
    <PageShell variant="executive">
      <CollectorsManagementPanel />
    </PageShell>
  );
}
