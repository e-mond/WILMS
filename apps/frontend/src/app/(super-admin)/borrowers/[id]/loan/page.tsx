import { PageShell } from '@/components/layout/PageShell';
import { BorrowerLoanDetailPanel } from '@/features/loan-management/components/BorrowerLoanDetailPanel';

interface BorrowerLoanPageProps {
  params: {
    id: string;
  };
  searchParams: {
    loanId?: string;
  };
}

export default function BorrowerLoanPage({ params, searchParams }: BorrowerLoanPageProps) {
  return (
    <PageShell variant="executive">
      <BorrowerLoanDetailPanel borrowerId={params.id} loanId={searchParams.loanId} />
    </PageShell>
  );
}
