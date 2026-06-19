import { Suspense } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { BorrowerList } from '@/features/borrower-management/components/BorrowerList';

export default function BorrowersPage() {
  return (
    <PageShell variant="executive">
      <Suspense fallback={<LoadingSpinner label="Loading borrowers" className="py-wilms-8" />}>
        <BorrowerList />
      </Suspense>
    </PageShell>
  );
}
