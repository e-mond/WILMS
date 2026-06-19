import { PageShell } from '@/components/layout/PageShell';
import { GroupsManagementPanel } from '@/features/group-management/components/GroupsManagementPanel';

export default function GroupsPage() {
  return (
    <PageShell variant="executive">
      <GroupsManagementPanel />
    </PageShell>
  );
}
