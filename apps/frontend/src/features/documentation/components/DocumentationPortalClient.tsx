'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { PageLoadingFallback } from '@/components/layout/PageLoadingFallback';

const DocumentationCentre = dynamic(
  () =>
    import('@/features/documentation/components/DocumentationCentre').then((module) => ({
      default: module.DocumentationCentre,
    })),
  { loading: () => <PageLoadingFallback label="Loading Documentation Centre" />, ssr: false },
);

export function DocumentationPortalClient() {
  const searchParams = useSearchParams();
  const bookId = searchParams.get('book') ?? undefined;
  return <DocumentationCentre initialBookId={bookId} />;
}
