import { Suspense } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { PageLoadingFallback } from '@/components/layout/PageLoadingFallback';
import { DocumentationPortalClient } from '@/features/documentation/components/DocumentationPortalClient';

export default function DocumentationPortalPage() {
  return (
    <PageShell
      variant="executive"
      description="Official WILMS Documentation Centre — browse, search, print, and download the enterprise product library."
    >
      <Suspense fallback={<PageLoadingFallback label="Loading Documentation Centre" />}>
        <DocumentationPortalClient />
      </Suspense>
    </PageShell>
  );
}
