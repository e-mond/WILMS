import { PageShell } from '@/components/layout/PageShell';
import { GroupCollectionSheet } from '@/features/payment-collection/components/GroupCollectionSheet';

interface GroupCollectionSheetPageProps {
  params: { id: string };
}

export default function GroupCollectionSheetPage({ params }: GroupCollectionSheetPageProps) {
  return (
    <PageShell variant="executive">
      <GroupCollectionSheet groupId={params.id} />
    </PageShell>
  );
}
