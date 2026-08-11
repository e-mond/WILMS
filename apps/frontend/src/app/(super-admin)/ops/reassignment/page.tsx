import dynamic from 'next/dynamic';
import { PageShell } from '@/components/layout/PageShell';
import { PageLoadingFallback } from '@/components/layout/PageLoadingFallback';

const OperationsReassignmentPanel = dynamic(
  () =>
    import('@/features/ops/components/OperationsReassignmentPanel').then((module) => ({
      default: module.OperationsReassignmentPanel,
    })),
  { loading: () => <PageLoadingFallback label="Loading reassignment tools" /> },
);

export default function OperationsReassignmentPage() {
  return (
    <PageShell variant="executive">
      <OperationsReassignmentPanel />
    </PageShell>
  );
}
