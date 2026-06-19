import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { cn } from '@/utils/cn';

export interface WilmsSplashScreenProps {
  message: string;
  className?: string;
}

export function WilmsSplashScreen({ message, className }: WilmsSplashScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'flex min-h-screen flex-col items-center justify-center bg-background px-wilms-4 text-center',
        className,
      )}
    >
      <p className="text-display font-bold tracking-wide text-brand-primary">WILMS</p>
      <p className="mt-wilms-1 text-small font-semibold uppercase tracking-widest text-text-muted">
        Women&apos;s Interest-Free Loan Management
      </p>
      <div className="mt-wilms-8">
        <LoadingSpinner label={message} />
      </div>
    </div>
  );
}
