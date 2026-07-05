import { Suspense } from 'react';
import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { BorrowerList } from '@/features/borrower-management/components/BorrowerList';

export default function BorrowersPage() {
  return (
    <PageShell variant="executive">
      <ModulePageIntro guidanceKey="borrowers" />
      <Suspense fallback={<LoadingSpinner label="Loading borrowers" className="py-wilms-8" />}>
        <BorrowerList />
      </Suspense>
    </PageShell>
  );
}
