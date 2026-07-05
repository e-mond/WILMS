import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { GroupsManagementPanel } from '@/features/group-management/components/GroupsManagementPanel';

export default function GroupsPage() {
  return (
    <PageShell variant="executive">
      <ModulePageIntro guidanceKey="groups" />
      <GroupsManagementPanel />
    </PageShell>
  );
}
