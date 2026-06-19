import { PageShell } from '@/components/layout/PageShell';
import { AdminFeeRecordingPanel } from '@/features/admin-fee/components/AdminFeeRecordingPanel';

interface AdminFeeBorrowerPageProps {
  params: {
    borrowerId: string;
  };
}

export default function AdminFeeBorrowerPage({ params }: AdminFeeBorrowerPageProps) {
  return (
    <PageShell variant="executive">
      <AdminFeeRecordingPanel borrowerId={params.borrowerId} />
    </PageShell>
  );
}
