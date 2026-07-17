import { Suspense } from 'react';
import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { TableSkeleton } from '@/components/feedback/PageSkeletons';
import { BorrowerList } from '@/features/borrower-management/components/BorrowerList';

export default function BorrowersPage() {
  return (
    <PageShell variant="executive">
      <ModulePageIntro guidanceKey="borrowers" />
      <Suspense fallback={<TableSkeleton rows={8} columns={5} />}>
        <BorrowerList />
      </Suspense>
    </PageShell>
  );
}
