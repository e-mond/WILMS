import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { CommunicationCenterPanel } from '@/features/communication-center/components/CommunicationCenterPanel';

export default function CommunicationCenterPage() {
  return (
    <PageShell variant="executive">
      <ModulePageIntro guidanceKey="communicationCenter" />
      <CommunicationCenterPanel />
    </PageShell>
  );
}
