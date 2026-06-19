import { PageShell } from '@/components/layout/PageShell';
import { PaymentEntryPanel } from '@/features/payment-collection/components/PaymentEntryPanel';

interface PaymentEntryPageProps {
  params: {
    id: string;
  };
}

export default function PaymentEntryPage({ params }: PaymentEntryPageProps) {
  return (
    <PageShell variant="executive">
      <PaymentEntryPanel borrowerId={params.id} />
    </PageShell>
  );
}
