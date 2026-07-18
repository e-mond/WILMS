import { cn } from '@/utils/cn';

export interface SkeletonProps {
  className?: string;
}

/** Layout-preserving placeholder with subtle shimmer (respects prefers-reduced-motion). */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('skeleton-shimmer rounded-md bg-muted/50', className)}
    />
  );
}
