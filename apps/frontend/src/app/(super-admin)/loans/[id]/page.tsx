import { PageShell } from '@/components/layout/PageShell';
import { LoanDetailPanel } from '@/features/loan-management/components/LoanDetailPanel';

interface LoanDetailPageProps {
  params: {
    id: string;
  };
}

export default function LoanDetailPage({ params }: LoanDetailPageProps) {
  return (
    <PageShell variant="executive">
      <LoanDetailPanel loanId={params.id} />
    </PageShell>
  );
}
