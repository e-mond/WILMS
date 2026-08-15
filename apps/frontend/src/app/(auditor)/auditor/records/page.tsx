import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { RecordsSearchPanel } from '@/features/records/components/RecordsSearchPanel';

export default function AuditorRecordsPage() {
  return (
    <PageShell variant="executive">
      <ModulePageIntro guidanceKey="borrowers" />
      <RecordsSearchPanel />
    </PageShell>
  );
}
