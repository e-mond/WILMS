import { PageShell } from '@/components/layout/PageShell';
import { GuarantorRecordPanel } from '@/features/records/components/GuarantorRecordPanel';

export default function GuarantorRecordFilePage({ params }: { params: { phone: string } }) {
  return (
    <PageShell variant="executive">
      <GuarantorRecordPanel phoneKey={params.phone} />
    </PageShell>
  );
}
