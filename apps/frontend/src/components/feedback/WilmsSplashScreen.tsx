import { Skeleton } from '@/components/feedback/Skeleton';

export interface WilmsSplashScreenProps {
  message?: string;
}

export function WilmsSplashScreen({ message = 'Loading' }: WilmsSplashScreenProps) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-wilms-4 bg-background px-wilms-4"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <p className="text-heading-1 font-semibold tracking-tight text-brand-primary">WILMS</p>
      <p className="text-small text-text-muted">Women&apos;s Interest-Free Loan Management</p>
      <div className="mt-wilms-2 w-full max-w-xs space-y-wilms-2" aria-hidden="true">
        <Skeleton className="mx-auto h-3 w-40" />
        <Skeleton className="mx-auto h-3 w-56" />
      </div>
      <p className="sr-only">{message}</p>
    </div>
  );
}
