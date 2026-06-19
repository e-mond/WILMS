import { PageShell } from '@/components/layout/PageShell';
import { BorrowerProfilePanel } from '@/features/borrower-management/components/BorrowerProfilePanel';

interface BorrowerProfilePageProps {
  params: {
    id: string;
  };
}

export default function BorrowerProfilePage({ params }: BorrowerProfilePageProps) {
  return (
    <PageShell variant="executive">
      <BorrowerProfilePanel borrowerId={params.id} />
    </PageShell>
  );
}
