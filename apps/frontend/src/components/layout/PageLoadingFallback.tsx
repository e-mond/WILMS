import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';

export interface PageLoadingFallbackProps {
  label?: string;
}

export function PageLoadingFallback({ label = 'Loading page' }: PageLoadingFallbackProps) {
  return <LoadingSpinner label={label} className="min-h-[40vh] py-wilms-8" />;
}
