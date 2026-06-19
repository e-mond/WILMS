import { PageShell } from '@/components/layout/PageShell';
import { GroupProfilePanel } from '@/features/group-management/components/GroupProfilePanel';

interface GroupProfilePageProps {
  params: {
    id: string;
  };
}

export default function GroupProfilePage({ params }: GroupProfilePageProps) {
  return (
    <PageShell variant="executive">
      <GroupProfilePanel groupId={params.id} />
    </PageShell>
  );
}
