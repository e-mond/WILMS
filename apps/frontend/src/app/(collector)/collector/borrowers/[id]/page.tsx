import { PageShell } from '@/components/layout/PageShell';
import { BorrowerProfilePanel } from '@/features/borrower-management/components/BorrowerProfilePanel';

interface CollectorBorrowerProfilePageProps {
  params: {
    id: string;
  };
}

export default function CollectorBorrowerProfilePage({ params }: CollectorBorrowerProfilePageProps) {
  return (
    <PageShell variant="executive">
      <BorrowerProfilePanel borrowerId={params.id} />
    </PageShell>
  );
}
