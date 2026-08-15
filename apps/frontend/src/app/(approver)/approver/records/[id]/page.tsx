import { PageShell } from '@/components/layout/PageShell';
import { RecordsFilePanel } from '@/features/records/components/RecordsFilePanel';

export default function ApproverRecordFilePage({ params }: { params: { id: string } }) {
  return (
    <PageShell variant="executive">
      <RecordsFilePanel borrowerId={params.id} />
    </PageShell>
  );
}
