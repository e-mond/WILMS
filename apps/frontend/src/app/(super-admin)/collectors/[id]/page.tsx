import { PageShell } from '@/components/layout/PageShell';
import { CollectorProfilePanel } from '@/features/collector-management/components/CollectorProfilePanel';

interface CollectorProfilePageProps {
  params: { id: string };
}

export default function CollectorProfilePage({ params }: CollectorProfilePageProps) {
  return (
    <PageShell variant="executive">
      <CollectorProfilePanel collectorId={params.id} />
    </PageShell>
  );
}
