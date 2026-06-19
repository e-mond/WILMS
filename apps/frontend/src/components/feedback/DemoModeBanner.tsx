import { isDemoMode, DEMO_MODE_MESSAGE } from '@/data-provider/types';
import { cn } from '@/utils/cn';

export interface DemoModeBannerProps {
  className?: string;
}

export function DemoModeBanner({ className }: DemoModeBannerProps) {
  if (!isDemoMode()) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'border-b border-warning bg-warning-light px-wilms-4 py-wilms-2 text-center text-small font-semibold text-text-primary',
        className,
      )}
    >
      {DEMO_MODE_MESSAGE}
    </div>
  );
}
