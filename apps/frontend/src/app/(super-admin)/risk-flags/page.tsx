import dynamic from 'next/dynamic';
import { PageShell } from '@/components/layout/PageShell';
import { PageLoadingFallback } from '@/components/layout/PageLoadingFallback';

const OverpaymentReviewPanel = dynamic(
  () =>
    import('@/features/overpayment-review/components/OverpaymentReviewPanel').then((module) => ({
      default: module.OverpaymentReviewPanel,
    })),
  { loading: () => <PageLoadingFallback label="Loading overpayment reviews" /> },
);

const RiskFlagsPanel = dynamic(
  () =>
    import('@/features/risk-flags/components/RiskFlagsPanel').then((module) => ({
      default: module.RiskFlagsPanel,
    })),
  { loading: () => <PageLoadingFallback label="Loading risk flags" /> },
);

export default function RiskFlagsPage() {
  return (
    <PageShell variant="executive">
      <div className="space-y-wilms-8">
        <OverpaymentReviewPanel />
        <RiskFlagsPanel />
      </div>
    </PageShell>
  );
}
