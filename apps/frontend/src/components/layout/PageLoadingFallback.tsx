import { DashboardPageSkeleton } from '@/components/feedback/PageSkeletons';

export interface PageLoadingFallbackProps {
  label?: string;
}

export function PageLoadingFallback({ label = 'Loading page' }: PageLoadingFallbackProps) {
  return <DashboardPageSkeleton aria-label={label} />;
}
